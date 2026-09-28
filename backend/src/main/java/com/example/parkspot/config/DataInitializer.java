package com.example.parkspot.config;

import com.example.parkspot.entity.Flat;
import com.example.parkspot.entity.ParkingSlot;
import com.example.parkspot.entity.Role;
import com.example.parkspot.entity.User;
import com.example.parkspot.repository.FlatRepository;
import com.example.parkspot.repository.ParkingSlotRepository;
import com.example.parkspot.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FlatRepository flatRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           FlatRepository flatRepository,
                           ParkingSlotRepository parkingSlotRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.flatRepository = flatRepository;
        this.parkingSlotRepository = parkingSlotRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Seed default users if empty
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(new User("admin", passwordEncoder.encode("admin123"), Role.ROLE_ADMIN));
        }
        if (!userRepository.existsByUsername("security1")) {
            userRepository.save(new User("security1", passwordEncoder.encode("password123"), Role.ROLE_SECURITY));
        }

        // Seed flats if empty
        if (flatRepository.count() == 0) {
            flatRepository.saveAll(List.of(
                    new Flat("101", "Arun Kumar"),
                    new Flat("102", "Priya Sharma"),
                    new Flat("201", "Rajesh V"),
                    new Flat("202", "Sneha Patel"),
                    new Flat("301", "Vikram Rathore"),
                    new Flat("302", "Deepa Sundar")
            ));
        }

        // Seed parking slots 1 to 10 if empty
        if (parkingSlotRepository.count() == 0) {
            for (int i = 1; i <= 10; i++) {
                parkingSlotRepository.save(new ParkingSlot(i));
            }
        }
    }
}
