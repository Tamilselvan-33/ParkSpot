package com.example.parkspot.service;

import com.example.parkspot.dto.VisitorEntryRequest;
import com.example.parkspot.dto.VisitorResponse;
import com.example.parkspot.entity.Flat;
import com.example.parkspot.entity.ParkingSlot;
import com.example.parkspot.entity.VisitorVehicle;
import com.example.parkspot.exception.InvalidActionException;
import com.example.parkspot.exception.ResourceNotFoundException;
import com.example.parkspot.exception.SlotOccupiedException;
import com.example.parkspot.repository.FlatRepository;
import com.example.parkspot.repository.ParkingSlotRepository;
import com.example.parkspot.repository.VisitorVehicleRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VisitorService {

    private final VisitorVehicleRepository visitorVehicleRepository;
    private final FlatRepository flatRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    public VisitorService(VisitorVehicleRepository visitorVehicleRepository,
                          FlatRepository flatRepository,
                          ParkingSlotRepository parkingSlotRepository) {
        this.visitorVehicleRepository = visitorVehicleRepository;
        this.flatRepository = flatRepository;
        this.parkingSlotRepository = parkingSlotRepository;
    }

    /**
     * Business Rule 1 & 4:
     * - Check if slot is occupied before assigning (throw 409 Conflict if occupied).
     * - Server generates entryTime automatically (Rule 4).
     * - Vehicle must not already be parked inside.
     */
    @Transactional
    public VisitorResponse registerEntry(VisitorEntryRequest request) {
        // Validate flat existence
        Flat flat = flatRepository.findById(request.getFlatId())
                .orElseThrow(() -> new ResourceNotFoundException("Flat with ID " + request.getFlatId() + " not found."));

        // Validate parking slot existence
        ParkingSlot slot = parkingSlotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot with ID " + request.getSlotId() + " not found."));

        // Rule 1: A slot cannot be assigned twice while exitTime is NULL
        if (visitorVehicleRepository.existsByParkingSlotIdAndExitTimeIsNull(slot.getId())) {
            throw new SlotOccupiedException("Parking slot " + slot.getSlotNumber() + " is already occupied.");
        }

        // Validate vehicle is not already parked inside society
        if (visitorVehicleRepository.findByVehicleNumberAndExitTimeIsNull(request.getVehicleNumber()).isPresent()) {
            throw new InvalidActionException("Vehicle " + request.getVehicleNumber() + " is already parked inside the society.");
        }

        // Rule 4: Server assigns entry timestamp
        VisitorVehicle visit = new VisitorVehicle(
                request.getVehicleNumber().trim().toUpperCase(),
                LocalDateTime.now(),
                flat,
                slot
        );

        VisitorVehicle saved = visitorVehicleRepository.save(visit);
        return mapToResponse(saved);
    }

    /**
     * Business Rule 2, 3 & 5:
     * - Entry must exist before exit can be recorded (Rule 2).
     * - A vehicle cannot exit twice (Rule 3).
     * - Server assigns exit timestamp (Rule 4).
     * - Visitor record is never deleted on exit (Rule 5).
     */
    @Transactional
    public VisitorResponse recordExit(Long visitorId) {
        VisitorVehicle visit = visitorVehicleRepository.findById(visitorId)
                .orElseThrow(() -> new ResourceNotFoundException("Visitor record with ID " + visitorId + " was not found."));

        // Rule 2: Entry must exist before exit
        if (visit.getEntryTime() == null) {
            throw new InvalidActionException("Cannot record exit because entry time was not recorded.");
        }

        // Rule 3: Vehicle cannot exit twice
        if (visit.getExitTime() != null) {
            throw new InvalidActionException("Vehicle has already exited at " + visit.getExitTime() + ".");
        }

        // Rule 4: Server controlled exit time
        visit.setExitTime(LocalDateTime.now());

        // Rule 5: Update exit time; do NOT delete the entity
        VisitorVehicle updated = visitorVehicleRepository.save(visit);
        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<VisitorResponse> getCurrentVisitors() {
        return visitorVehicleRepository.findByExitTimeIsNullOrderByEntryTimeDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VisitorResponse> getAllVisitors() {
        return visitorVehicleRepository.findAll(Sort.by(Sort.Direction.DESC, "entryTime"))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VisitorResponse getVisitorById(Long id) {
        VisitorVehicle visit = visitorVehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visitor record with ID " + id + " was not found."));
        return mapToResponse(visit);
    }

    private VisitorResponse mapToResponse(VisitorVehicle visit) {
        return new VisitorResponse(
                visit.getId(),
                visit.getVehicleNumber(),
                visit.getFlat().getId(),
                visit.getFlat().getFlatNumber(),
                visit.getFlat().getResidentName(),
                visit.getParkingSlot().getId(),
                visit.getParkingSlot().getSlotNumber(),
                visit.getEntryTime(),
                visit.getExitTime()
        );
    }
}
