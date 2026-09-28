package com.example.parkspot.repository;

import com.example.parkspot.entity.VisitorVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VisitorVehicleRepository extends JpaRepository<VisitorVehicle, Long> {

    // Check if slot currently has an active vehicle parked
    boolean existsByParkingSlotIdAndExitTimeIsNull(Long parkingSlotId);

    // Get active visit on a slot
    Optional<VisitorVehicle> findByParkingSlotIdAndExitTimeIsNull(Long parkingSlotId);

    // Get all currently parked vehicles
    List<VisitorVehicle> findByExitTimeIsNullOrderByEntryTimeDesc();

    // Find if a vehicle is already parked inside
    Optional<VisitorVehicle> findByVehicleNumberAndExitTimeIsNull(String vehicleNumber);

    // Date range reports based on entryTime
    List<VisitorVehicle> findByEntryTimeBetweenOrderByEntryTimeDesc(LocalDateTime start, LocalDateTime end);
}
