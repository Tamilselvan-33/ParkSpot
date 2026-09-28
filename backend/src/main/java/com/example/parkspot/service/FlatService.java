package com.example.parkspot.service;

import com.example.parkspot.dto.FlatRequest;
import com.example.parkspot.dto.FlatResponse;
import com.example.parkspot.entity.Flat;
import com.example.parkspot.exception.InvalidActionException;
import com.example.parkspot.exception.ResourceNotFoundException;
import com.example.parkspot.repository.FlatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FlatService {

    private final FlatRepository flatRepository;

    public FlatService(FlatRepository flatRepository) {
        this.flatRepository = flatRepository;
    }

    @Transactional
    public FlatResponse createFlat(FlatRequest request) {
        if (flatRepository.existsByFlatNumber(request.getFlatNumber())) {
            throw new InvalidActionException("Flat with number " + request.getFlatNumber() + " already exists.");
        }
        Flat flat = new Flat(request.getFlatNumber(), request.getResidentName());
        Flat saved = flatRepository.save(flat);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<FlatResponse> getAllFlats() {
        return flatRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FlatResponse getFlatById(Long id) {
        Flat flat = flatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flat with ID " + id + " not found."));
        return mapToResponse(flat);
    }

    private FlatResponse mapToResponse(Flat flat) {
        return new FlatResponse(flat.getId(), flat.getFlatNumber(), flat.getResidentName());
    }
}
