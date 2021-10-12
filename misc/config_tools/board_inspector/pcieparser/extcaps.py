# Copyright (C) 2021 Intel Corporation. All rights reserved.
#
# SPDX-License-Identifier: BSD-3-Clause
#

import ctypes
import copy
import lib.cdata as cdata


class ExtendedCapability:
    # Capability names from PCI Express Base Specification, mostly Table 9-23
    _cap_names_ = {
        0x01: "Advanced Error Reporting",
        0x02: "Virtual Channel",
        0x03: "Device Serial Number",
        0x04: "Power Budgeting",
        0x05: "Root Complex Link Declaration",
        0x06: "Root Complex Internal Link Control",
        0x07: "Root Complex Event Collector Endpoint Association",
        0x08: "Multi-Function Virtual Channel",
        0x09: "Virtual Channel",
        0x0A: "RCRB Header",
        0x0B: "Vendor-Specific Extended",
        0x0C: "Configuration Access Correlation",
        0x0D: "ACS",
        0x0E: "ARI",
        0x0F: "ATS",
        0x10: "SR-IOV",
        0x11: "MR-IOV",
        0x12: "Multicast",
        0x13: "PRI",
        0x15: "Resizable BAR",
        0x16: "DPA",
        0x17: "TPH Requester",
        0x18: "LTR",
        0x19: "Secondary PCI Express",
        0x1A: "PMUX",
        0x1B: "PASID",
        0x1C: "LNR",
        0x1D: "DPC",
        0x1E: "L1 PM Substates",
        0x1F: "TPM",
        0x20: "M-PCIe",
        0x21: "FRS Queueing",
        0x22: "Readiness Time Reporting",
        0x23: "Designated Vendor-Specific",
        0x24: "VF Resizable BAR",
        0x25: "Data Link Feature",
        0x26: "Physical Layer 16.0 GT/s",
        0x27: "Lane Margining at the Receiver",
        0x28: "Hierarchy ID",
        0x29: "NPEM",
        0x2A: "Physical Layer 32.0 GT/s",
        0x2B: "Alternate Protocol",
        0x2C: "SFI",
    }

    @property
    def name(self):
        if self.id in self._cap_names_.keys():
            return self._cap_names_[self.id]
        else:
            return f"Reserved Extended ({hex(self.id)})"


class ExtendedCapabilityListRegister(cdata.Struct, ExtendedCapability):
    _pack_ = 1
    _fields_ = [
        ("id", ctypes.c_uint32, 16),
        ("version", ctypes.c_uint32, 4),
        ("next_cap_ptr_raw", ctypes.c_uint32, 12),
    ]

    @property
    def next_cap_ptr(self):
        return self.next_cap_ptr_raw & 0xFFC


# Module API


def extended_capabilities(data):
    buf = ctypes.create_string_buffer(data, len(data))
    cap_ptr = 0x100

    acc = list()
    while cap_ptr != 0:
        caplist = ExtendedCapabilityListRegister.from_buffer_copy(buf, cap_ptr)
        if caplist.id != 0:
            acc.append(caplist)
        cap_ptr = caplist.next_cap_ptr

    return acc
