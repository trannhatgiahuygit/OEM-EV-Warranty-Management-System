package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.part.*;

import java.util.List;

public interface PartSerialService {

    /**
     * 2.1. Đăng ký serial mới vào kho
     */
    PartSerialDTO createPartSerial(CreatePartSerialRequestDTO request);

    /**
     * 2.5. Xem danh sách serial khả dụng (in_stock)
     */
    List<PartSerialDTO> getAvailableSerials(Integer partId);

    /**
     * 3.1. Gắn serial lên xe
     */
    PartSerialDTO installPartSerial(InstallPartSerialRequestDTO request);

    /**
     * 3.2. Thay thế phụ tùng (tháo cũ + gắn mới)
     */
    PartSerialDTO replacePartSerial(ReplacePartSerialRequestDTO request);

    /**
     * 3.3. Tháo serial khỏi xe
     */
    PartSerialDTO uninstallPartSerial(UninstallPartSerialRequestDTO request);

    /**
     * 4.1. Xem phụ tùng đang lắp trên xe
     */
    VehiclePartsResponseDTO getVehicleInstalledParts(String vin);

    /**
     * Get serial by serial number
     */
    PartSerialDTO getPartSerialBySerialNumber(String serialNumber);

    /**
     * Get all serials by status
     */
    List<PartSerialDTO> getPartSerialsByStatus(String status);

    /**
     * Get all serials
     */
    List<PartSerialDTO> getAllPartSerials();

    /**
     * Nhận phụ tùng cho work order
     */
    List<PartSerialDTO> receivePartSerialsForWorkOrder(ReceivePartSerialForWorkOrderRequestDTO request);
}
