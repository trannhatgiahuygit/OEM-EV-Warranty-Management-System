package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "role_name", length = 50, unique = true, nullable = false)
    private String roleName;

    @Column(length = 200)
    private String description;

    @OneToMany(mappedBy = "roleId", cascade = CascadeType.REMOVE, fetch = FetchType.LAZY)
    private List<User> users;

}
