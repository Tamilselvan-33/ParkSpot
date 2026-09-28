package com.example.parkspot.controller;

import com.example.parkspot.dto.VisitorEntryRequest;
import com.example.parkspot.dto.VisitorResponse;
import com.example.parkspot.service.VisitorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visitors")
public class VisitorController {

    private final VisitorService visitorService;

    public VisitorController(VisitorService visitorService) {
        this.visitorService = visitorService;
    }

    @PostMapping
    public ResponseEntity<VisitorResponse> registerEntry(@Valid @RequestBody VisitorEntryRequest request) {
        VisitorResponse response = visitorService.registerEntry(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/exit")
    public ResponseEntity<VisitorResponse> recordExit(@PathVariable Long id) {
        VisitorResponse response = visitorService.recordExit(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/current")
    public ResponseEntity<List<VisitorResponse>> getCurrentVisitors() {
        return ResponseEntity.ok(visitorService.getCurrentVisitors());
    }

    @GetMapping
    public ResponseEntity<List<VisitorResponse>> getAllVisitors() {
        return ResponseEntity.ok(visitorService.getAllVisitors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VisitorResponse> getVisitorById(@PathVariable Long id) {
        return ResponseEntity.ok(visitorService.getVisitorById(id));
    }
}
