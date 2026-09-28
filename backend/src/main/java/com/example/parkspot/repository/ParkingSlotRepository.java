package com.example.parkspot.repository;

import com.example.parkspot.entity.ParkingSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {
    Optional<ParkingSlot> findBySlotNumber(Integer slotNumber);
    boolean existsBySlotNumber(Integer slotNumber);
}
