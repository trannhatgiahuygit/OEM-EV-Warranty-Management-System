package com.ev.warranty.security;

import com.ev.warranty.model.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

@Slf4j
public class CustomUserDetails implements UserDetails {
    private final String username;
    private final String password;
    private final boolean enabled;
    private final List<GrantedAuthority> authorities;

    public CustomUserDetails(User user) {
        this.username = user.getUsername();
        this.password = user.getPasswordHash();
        this.enabled = true;
        String roleName = "ROLE_" + user.getRole().getRoleName();
        this.authorities = Collections.singletonList(
                new SimpleGrantedAuthority(roleName)
        );
        log.info("🎭 Created CustomUserDetails:");
        log.info("   → Username: {}", username);
        log.info("   → Role from DB: {}", user.getRole().getRoleName());
        log.info("   → Authority created: {}", roleName);
        log.info("   → Full authorities: {}", this.authorities);
    }

    public static CustomUserDetails create(User user) {
        return new CustomUserDetails(user);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
