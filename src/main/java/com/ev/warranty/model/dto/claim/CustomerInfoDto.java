package com.ev.warranty.model.dto.claim;

import lombok.Data;

@Data
public class CustomerInfoDto {
    private Integer id;
    private String name;
    private String phone;
    private String email;
    private String address;
}
