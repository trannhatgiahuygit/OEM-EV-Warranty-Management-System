package com.ev.warranty.security;

import com.ev.warranty.service.inter.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            @Qualifier("customUserDetailsServiceImpl") UserDetailsService userDetailsService
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getServletPath();
        log.debug("🔍 Processing request: {} {}", request.getMethod(), path);

        // Skip JWT validation for auth and swagger endpoints
        if (path.startsWith("/api/auth") ||
                path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/swagger-resources") ||
                path.startsWith("/webjars") ||
                path.equals("/swagger-ui.html")) {
            log.debug("⏭️ Skipping JWT validation for public endpoint: {}", path);
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = getTokenFromRequest(request);
            log.debug("🎫 Token extracted: {}", token != null ? "Yes" : "No");

            if (token != null && jwtService.validateToken(token)) {
                String username = jwtService.getUsernameFromToken(token);
                log.info("✅ Valid token for user: {}", username);

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                log.info("👤 User loaded - Username: {}, Authorities: {}",
                    userDetails.getUsername(),
                    userDetails.getAuthorities());

                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);

                log.info("🔐 Authentication successful - User: {}, Authorities: {}",
                    username,
                    userDetails.getAuthorities().stream()
                        .map(a -> a.getAuthority())
                        .toList());
            } else {
                // Don't log warnings for OPTIONS requests (CORS preflight - expected to not have token)
                if (!"OPTIONS".equalsIgnoreCase(request.getMethod())) {
                    log.warn("❌ Invalid or missing token for: {} {}", request.getMethod(), path);
                }
            }
        } catch (Exception e) {
            log.error("💥 Authentication error for {} {}: {}",
                request.getMethod(),
                path,
                e.getMessage(),
                e);
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}