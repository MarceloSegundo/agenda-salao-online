package com.agenda.api.security;

import com.agenda.api.model.User;
import com.agenda.api.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("Trying to load user: " + username);
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> {
                    System.out.println("User not found in DB: " + username);
                    return new UsernameNotFoundException("Usuário não encontrado: " + username);
                });
        System.out.println("User found: " + user.getEmail() + " with password: " + user.getPassword());
        return new CustomUserDetails(user);
    }
}
