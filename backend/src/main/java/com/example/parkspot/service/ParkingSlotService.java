package com.example.parkspot.service;

import com.example.parkspot.dto.SlotRequest;
import com.example.parkspot.dto.SlotStatusResponse;
import com.example.parkspot.entity.ParkingSlot;
import com.example.parkspot.entity.VisitorVehicle;
import com.example.parkspot.exception.InvalidActionException;
import com.example.parkspot.exception.ResourceNotFoundException;
import com.example.parkspot.exception.SlotOccupiedException;
import com.example.parkspot.repository.ParkingSlotRepository;
import com.example.parkspot.repository.VisitorVehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ParkingSlotService {

    private final ParkingSlotRepository parkingSlotRepository;
    private final VisitorVehicleRepository visitorVehicleRepository;

    public ParkingSlotService(ParkingSlotRepository parkingSlotRepository,
                              VisitorVehicleRepository visitorVehicleRepository) {
        this.parkingSlotRepository = parkingSlotRepository;
        this.visitorVehicleRepository = visitorVehicleRepository;
    }

    @Transactional
    public SlotStatusResponse createSlot(SlotRequest request) {
        if (parkingSlotRepository.existsBySlotNumber(request.getSlotNumber())) {
            throw new InvalidActionException("Parking slot " + request.getSlotNumber() + " already exists.");
        }
        ParkingSlot slot = new ParkingSlot(request.getSlotNumber());
        ParkingSlot saved = parkingSlotRepository.save(slot);
        return new SlotStatusResponse(saved.getId(), saved.getSlotNumber(), "FREE");
    }

    @Transactional
    public void deleteSlot(Long id) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot with ID " + id + " not found."));

        if (visitorVehicleRepository.existsByParkingSlotIdAndExitTimeIsNull(id)) {
            throw new SlotOccupiedException("Cannot delete parking slot " + slot.getSlotNumber() + " because it is currently occupied.");
        }

        parkingSlotRepository.delete(slot);
    }

    @Transactional(readOnly = true)
    public List<SlotStatusResponse> getAllSlotsWithStatus() {
        return parkingSlotRepository.findAll()
                .stream()
                .map(this::mapSlotToStatusResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SlotStatusResponse> getOccupiedSlots() {
        return parkingSlotRepository.findAll()
                .stream()
                .filter(slot -> visitorVehicleRepository.existsByParkingSlotIdAndExitTimeIsNull(slot.getId()))
                .map(this::mapSlotToStatusResponse)
                .collect(Collectors.toList());
    }

    private SlotStatusResponse mapSlotToStatusResponse(ParkingSlot slot) {
        Optional<VisitorVehicle> activeVisit = visitorVehicleRepository.findByParkingSlotIdAndExitTimeIsNull(slot.getId());
        if (activeVisit.isPresent()) {
            VisitorVehicle visit = activeVisit.get();
            return new SlotStatusResponse(
                    slot.getId(),
                    slot.getSlotNumber(),
                    "OCCUPIED",
                    visit.getId(),
                    visit.getVehicleNumber(),
                    visit.getFlat().getFlatNumber(),
                    visit.getEntryTime()
            );
        } else {
            return new SlotStatusResponse(slot.getId(), slot.getSlotNumber(), "FREE");
        }
    }
}
