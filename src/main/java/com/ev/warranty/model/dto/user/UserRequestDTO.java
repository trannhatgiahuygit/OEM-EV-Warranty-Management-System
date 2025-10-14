package com.ev.warranty.model.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserRequestDTO {
    private String username;
    private String email;
    private String password; // vẫn để đây để lấy input, nhưng không trả ra
    private String fullname;
    private String phone;
    private int roleId; // thay vì object Role, chỉ nhận ID
}
