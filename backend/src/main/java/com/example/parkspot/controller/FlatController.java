package com.example.parkspot.controller;

import com.example.parkspot.dto.FlatRequest;
import com.example.parkspot.dto.FlatResponse;
import com.example.parkspot.service.FlatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flats")
public class FlatController {

    private final FlatService flatService;

    public FlatController(FlatService flatService) {
        this.flatService = flatService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlatResponse> createFlat(@Valid @RequestBody FlatRequest request) {
        FlatResponse response = flatService.createFlat(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<FlatResponse>> getAllFlats() {
        return ResponseEntity.ok(flatService.getAllFlats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlatResponse> getFlatById(@PathVariable Long id) {
        return ResponseEntity.ok(flatService.getFlatById(id));
    }
}
