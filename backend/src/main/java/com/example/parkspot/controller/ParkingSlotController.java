package com.example.parkspot.controller;

import com.example.parkspot.dto.SlotRequest;
import com.example.parkspot.dto.SlotStatusResponse;
import com.example.parkspot.service.ParkingSlotService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parking-slots")
public class ParkingSlotController {

    private final ParkingSlotService parkingSlotService;

    public ParkingSlotController(ParkingSlotService parkingSlotService) {
        this.parkingSlotService = parkingSlotService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SlotStatusResponse> createSlot(@Valid @RequestBody SlotRequest request) {
        SlotStatusResponse response = parkingSlotService.createSlot(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSlot(@PathVariable Long id) {
        parkingSlotService.deleteSlot(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<SlotStatusResponse>> getAllSlots() {
        return ResponseEntity.ok(parkingSlotService.getAllSlotsWithStatus());
    }

    @GetMapping("/occupied")
    public ResponseEntity<List<SlotStatusResponse>> getOccupiedSlots() {
        return ResponseEntity.ok(parkingSlotService.getOccupiedSlots());
    }
}
