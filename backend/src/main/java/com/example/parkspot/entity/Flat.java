package com.example.parkspot.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "flats")
public class Flat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "flat_number", nullable = false, unique = true, length = 20)
    private String flatNumber;

    @NotBlank
    @Column(name = "resident_name", nullable = false, length = 100)
    private String residentName;

    public Flat() {
    }

    public Flat(String flatNumber, String residentName) {
        this.flatNumber = flatNumber;
        this.residentName = residentName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFlatNumber() {
        return flatNumber;
    }

    public void setFlatNumber(String flatNumber) {
        this.flatNumber = flatNumber;
    }

    public String getResidentName() {
        return residentName;
    }

    public void setResidentName(String residentName) {
        this.residentName = residentName;
    }
}
