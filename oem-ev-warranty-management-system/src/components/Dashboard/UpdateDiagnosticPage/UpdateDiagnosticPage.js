// UpdateDiagnosticPage.js

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaSave, FaExclamationTriangle, FaTimesCircle, FaUpload, FaFileAlt } from 'react-icons/fa'; 
import './UpdateDiagnosticPage.css'; 

// Initial state for a new required part, now with search/query fields
const initialPart = {
  partId: '',
  partName: '',
  quantity: 1,
  searchQuery: '',
  searchResults: [],
  showResults: false,
};

const UpdateDiagnosticPage = ({ handleBackClick, claimId }) => {
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Remaining States
  const [diagnosticDetails, setDiagnosticDetails] = useState(''); 
  const [estimatedRepairCost, setEstimatedRepairCost] = useState(''); // This state is used for the input field value
  const [requiredParts, setRequiredParts] = useState([initialPart]);
  
  // ===== NEW: Repair type and warranty eligibility states =====
  const [repairType, setRepairType] = useState('EVM_REPAIR'); // EVM_REPAIR or SC_REPAIR
  const [warrantyEligibilityAssessment, setWarrantyEligibilityAssessment] = useState('');
  const [isWarrantyEligible, setIsWarrantyEligible] = useState(null);
  const [warrantyEligibilityNotes, setWarrantyEligibilityNotes] = useState('');
  
  // ===== NEW: Service catalog states =====
  const [serviceCatalogItems, setServiceCatalogItems] = useState([]);
  const [serviceItems, setServiceItems] = useState([]); // Available service items from API
  const [totalServiceCost, setTotalServiceCost] = useState(0);
  
  // ===== NEW: Third party parts states (for SC Repair) =====
  const [thirdPartyParts, setThirdPartyParts] = useState([]);
  const [availableThirdPartyParts, setAvailableThirdPartyParts] = useState([]);
  
  // --- NEW: Added States for Comprehensive Payload ---
  const [diagnosticSummary, setDiagnosticSummary] = useState(''); 
  // REMOVED: diagnosticData state
  const [testResults, setTestResults] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [initialDiagnosis, setInitialDiagnosis] = useState(''); 
  // REMOVED: estimatedRepairTime state
  const [readyForSubmission, setReadyForSubmission] = useState(false);
  const [reportedFailure, setReportedFailure] = useState(''); // Reported failure description
  // --- END NEW States ---
  
  // --- MODIFIED: File/Attachment States ---
  const [uploadingFiles, setUploadingFiles] = useState([]); 
  const [existingAttachments, setExistingAttachments] = useState([]); 
  const fileInputRef = useRef(null);
  // --- END MODIFIED File/Attachment States ---
  
  const [allPartSerials, setAllPartSerials] = useState([]);
  const [partDataLoading, setPartDataLoading] = useState(false);

  const effectRan = useRef(false);

  // --- Data Fetching: Claim Details & Part Serials ---
  useEffect(() => {
    if (effectRan.current || !claimId) return;
    effectRan.current = true;

    const user = JSON.parse(localStorage.getItem('user'));
    const token = user.token;

    const fetchAllData = async () => {
      setLoading(true);
      
      // 1. Fetch Part Serials
      setPartDataLoading(true);
      try {
        const partResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/part-serials`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (partResponse.status === 200) {
          setAllPartSerials(partResponse.data);
        }
      } catch (err) {
        toast.error('Không thể tải danh mục phụ tùng để tìm kiếm.');
      } finally {
        setPartDataLoading(false);
      }
      
      // ===== NEW: Fetch service items from catalog =====
      try {
        const serviceResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/service-catalog/items`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (serviceResponse.status === 200) {
          setServiceItems(serviceResponse.data.content || serviceResponse.data || []);
        }
      } catch (err) {
        console.warn('Could not load service catalog items:', err);
        // Non-critical, continue
      }
      
      // ===== NEW: Fetch third party parts (for SC Repair) =====
      try {
        const thirdPartyResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/third-party-parts`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (thirdPartyResponse.status === 200) {
          setAvailableThirdPartyParts(thirdPartyResponse.data.content || thirdPartyResponse.data || []);
        }
      } catch (err) {
        console.warn('Could not load third party parts:', err);
        // Non-critical, continue
      }
      
      // 2. Fetch Claim Details
      try {
        const claimResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/claims/${claimId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (claimResponse.status === 200) {
          const claimData = claimResponse.data;
          setClaim(claimData);

          // Pre-populate fields
          // Note: diagnosticSummary and initialDiagnosis are intentionally empty on load as per previous request
          setDiagnosticSummary(claimData.diagnosticSummary || ''); 
          setInitialDiagnosis(claimData.initialDiagnosis || ''); 
          
          setDiagnosticDetails(claimData.diagnosticDetails || ''); 
          setEstimatedRepairCost(claimData.estimatedRepairCost || ''); 
          // REMOVED: setEstimatedRepairTime(claimData.estimatedRepairTime || ''); 
          // REMOVED: setDiagnosticData(claimData.diagnosticData || '');
          setTestResults(claimData.testResults || '');
          setRepairNotes(claimData.repairNotes || '');
          setLaborHours(claimData.laborHours || '');
          setReadyForSubmission(claimData.readyForSubmission || false);
          setReportedFailure(claimData.reportedFailure || ''); // Load reported failure from claim
          
          // ===== NEW: Load repair type and warranty eligibility =====
          setRepairType(claimData.repairType || 'EVM_REPAIR');
          setWarrantyEligibilityAssessment(claimData.warrantyEligibilityAssessment || '');
          setIsWarrantyEligible(claimData.isWarrantyEligible);
          setWarrantyEligibilityNotes(claimData.warrantyEligibilityNotes || '');
          setServiceCatalogItems(claimData.serviceCatalogItems || []);
          setTotalServiceCost(claimData.totalServiceCost || 0);
          
          const existingParts = claimData.requiredParts?.length > 0 
              ? claimData.requiredParts.map(p => ({
                  ...initialPart,
                  partId: String(p.partId), 
                  partName: p.partName,
                  quantity: p.quantity,
                  searchQuery: p.partName, 
                })) 
              : [initialPart];
              
          setRequiredParts(existingParts);
          
          // Populate existing attachments
          setExistingAttachments(claimData.attachments || []);
        }
      } catch (err) {
        toast.error('Không thể tải dữ liệu yêu cầu.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [claimId]);

  // --- Search Logic Helper (UNMODIFIED) ---
  const performPartSearch = (query) => {
    const queryLower = query.toLowerCase();
    if (queryLower.length < 2) return [];

    const filteredParts = allPartSerials.filter(part => 
      part.status === 'in_stock' && ( 
        part.partName.toLowerCase().includes(queryLower) ||
        part.partNumber.toLowerCase().includes(queryLower) ||
        String(part.partId).includes(queryLower)
      )
    );
    
    const uniqueParts = [];
    const seenPartKeys = new Set();
    
    filteredParts.forEach(part => {
        const partKey = `${part.partId}-${part.partName}`;
        if (!seenPartKeys.has(partKey)) {
            uniqueParts.push(part);
            seenPartKeys.add(partKey);
        }
    });

    return uniqueParts;
  };
  // --- End Search Logic Helper ---

  // --- Part Management Handlers (UNMODIFIED) ---
  const handlePartChange = (index, field, value) => {
    const newParts = [...requiredParts];
    newParts[index][field] = value;

    if (field === 'searchQuery') {
      newParts[index].searchResults = performPartSearch(value);
      newParts[index].showResults = true;
      newParts[index].partId = '';
      newParts[index].partName = '';
    } else if (field === 'quantity') {
      newParts[index].quantity = Math.max(1, parseInt(value, 10) || 1); 
    }
    
    setRequiredParts(newParts);
  };
  
  const handlePartSelect = (index, part) => {
    const newParts = [...requiredParts];
    newParts[index] = {
      ...newParts[index],
      partId: String(part.partId), 
      partName: part.partName,
      searchQuery: part.partName, 
      searchResults: [],
      showResults: false,
    };
    setRequiredParts(newParts);
  };
  
  const handleInputFocus = (index) => {
      const newParts = [...requiredParts];
      if (newParts[index].searchQuery.length > 0 && newParts[index].searchResults.length > 0) {
          newParts[index].showResults = true;
      }
      setRequiredParts(newParts);
  }

  const handleInputBlur = (index) => {
    setTimeout(() => {
        setRequiredParts(prev => prev.map((item, i) => 
            i === index ? { ...item, showResults: false } : item
        ));
    }, 200); 
  }

  const handleAddPart = () => {
    const lastPart = requiredParts[requiredParts.length - 1];
    if (lastPart && lastPart.partId && lastPart.partName && lastPart.quantity > 0) {
        setRequiredParts([...requiredParts, initialPart]);
    } else if (requiredParts.length === 1 && !lastPart.partId) {
         setRequiredParts([...requiredParts, initialPart]);
    } else {
         toast.warn('Vui lòng hoàn tất mục phụ tùng hiện tại trước khi thêm mục mới.');
    }
  };

  const handleRemovePart = (index) => {
    const newParts = requiredParts.filter((_, i) => i !== index);
    setRequiredParts(newParts.length > 0 ? newParts : [initialPart]); 
  };
  // --- End Part Management Handlers ---
  
  // ===== NEW: Service Catalog Handlers =====
  const handleAddServiceItem = async (serviceItem) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      // Fetch current price for this service item
      const priceResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/service-catalog/prices/current`,
        {
          params: {
            itemType: 'SERVICE',
            itemId: serviceItem.id
          },
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const currentPrice = priceResponse.data?.price || serviceItem.basePrice || 0;
      
      const newServiceItem = {
        serviceItemId: serviceItem.id,
        serviceItemCode: serviceItem.code || serviceItem.serviceCode,
        serviceItemName: serviceItem.name || serviceItem.serviceName,
        unitPrice: currentPrice,
        quantity: 1,
        totalPrice: currentPrice,
        notes: ''
      };
      
      setServiceCatalogItems([...serviceCatalogItems, newServiceItem]);
      updateTotalServiceCost([...serviceCatalogItems, newServiceItem]);
      toast.success(`Đã thêm dịch vụ: ${newServiceItem.serviceItemName}`);
    } catch (err) {
      toast.error('Không thể lấy giá dịch vụ. Vui lòng thử lại.');
    }
  };
  
  const handleUpdateServiceItem = (index, field, value) => {
    const newItems = [...serviceCatalogItems];
    if (field === 'quantity') {
      newItems[index].quantity = Math.max(1, parseInt(value, 10) || 1);
      newItems[index].totalPrice = newItems[index].unitPrice * newItems[index].quantity;
    } else if (field === 'unitPrice') {
      newItems[index].unitPrice = parseFloat(value) || 0;
      newItems[index].totalPrice = newItems[index].unitPrice * newItems[index].quantity;
    } else {
      newItems[index][field] = value;
    }
    setServiceCatalogItems(newItems);
    updateTotalServiceCost(newItems);
  };
  
  const handleRemoveServiceItem = (index) => {
    const newItems = serviceCatalogItems.filter((_, i) => i !== index);
    setServiceCatalogItems(newItems);
    updateTotalServiceCost(newItems);
  };
  
  const updateTotalServiceCost = (items) => {
    const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setTotalServiceCost(total);
  };
  
  // ===== NEW: Third Party Parts Handlers (for SC Repair) =====
  const handleAddThirdPartyPart = (part) => {
    const newPart = {
      thirdPartyPartId: part.id,
      partName: part.name,
      unitPrice: part.unitCost || 0,
      quantity: 1,
      totalPrice: part.unitCost || 0,
      notes: ''
    };
    
    // Check if part already exists in requiredParts or thirdPartyParts
    const existingIndex = requiredParts.findIndex(p => 
      p.thirdPartyPartId === part.id
    );
    
    if (existingIndex >= 0) {
      // Update quantity
      const newParts = [...requiredParts];
      newParts[existingIndex].quantity += 1;
      newParts[existingIndex].totalPrice = newParts[existingIndex].unitPrice * newParts[existingIndex].quantity;
      setRequiredParts(newParts);
    } else {
      // Add as third party part
      const newParts = [...requiredParts, {
        ...initialPart,
        thirdPartyPartId: part.id,
        partName: part.name,
        unitPrice: part.unitCost || 0,
        quantity: 1,
        totalPrice: part.unitCost || 0,
        searchQuery: part.name,
        isThirdParty: true
      }];
      setRequiredParts(newParts);
    }
  };
  
  const handleUpdateThirdPartyPartPrice = (index, price) => {
    const newParts = [...requiredParts];
    newParts[index].unitPrice = parseFloat(price) || 0;
    newParts[index].totalPrice = newParts[index].unitPrice * newParts[index].quantity;
    setRequiredParts(newParts);
  };

  
  // --- File Upload Logic (UNMODIFIED) ---
  
  const uploadFileImmediately = async (file, token) => {
      const fileName = file.name;

      // 1. Add to uploading state
      setUploadingFiles(prev => [...prev, fileName]);
      
      const formData = new FormData();
      formData.append('file', file);

      try {
          const response = await axios.post(
              `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/attachments/upload`,
              formData,
              {
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'multipart/form-data',
                  },
              }
          );

          if (response.status === 200 || response.status === 201) {
              toast.success(`Tệp ${fileName} đã được tải lên thành công.`);
              // Add successful upload to existing attachments list
              setExistingAttachments(prev => [...prev, response.data]);
          } else {
              toast.error(`Không thể tải lên tệp ${fileName}: Lỗi máy chủ.`);
          }
      } catch (error) {
          toast.error(`Không thể tải lên tệp ${fileName}: ${error.response?.data?.message || error.message}`);
      } finally {
          // 2. Remove from uploading state
          setUploadingFiles(prev => prev.filter(name => name !== fileName));
      }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []).filter(Boolean);
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.token) {
        toast.error('Người dùng chưa được xác thực. Không thể tải lên tệp.');
        return;
    }
    const token = user.token;

    newFiles.forEach(file => {
        // Prevent duplicate uploads (by name, regardless of case)
        const fileNameLower = file.name.toLowerCase();
        const isDuplicate = existingAttachments.some(att => att.filePath.toLowerCase().includes(fileNameLower)) ||
                            uploadingFiles.map(n => n.toLowerCase()).includes(fileNameLower);
        
        if (!isDuplicate) {
            uploadFileImmediately(file, token);
        } else {
            toast.warn(`Tệp "${file.name}" đã được tải lên hoặc đang được tải lên.`);
        }
    });

    if (fileInputRef.current) {
        fileInputRef.current.value = null; // Clear the file input
    }
  };
  
  const handleDownloadAttachment = async (attachment) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) {
      toast.error('Người dùng chưa được xác thực.');
      return;
    }
    
    try {
      // Use downloadUrl if available, otherwise construct from filePath
      let downloadUrl;
      if (attachment.downloadUrl) {
        downloadUrl = `${process.env.REACT_APP_API_URL}${attachment.downloadUrl}`;
      } else if (attachment.id && claimId) {
        // Fallback: use API endpoint
        downloadUrl = `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/attachments/${attachment.id}/download`;
      } else {
        // Last resort: try static file serving
        const fileName = attachment.filePath?.split('/').pop() || attachment.fileName || 'attachment';
        downloadUrl = `${process.env.REACT_APP_API_URL}/uploads/attachments/${fileName}`;
      }
      
      const response = await axios.get(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalFileName || attachment.fileName || attachment.filePath?.split('/').pop() || 'attachment';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success(`Đã tải xuống ${link.download}`);
    } catch (error) {
      toast.error(`Không thể tải xuống tệp: ${error.response?.data?.message || error.message}`);
    }
  };

  
  const handleDeleteAttachment = async (attachmentId) => {
      if (isSubmitting) return;

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
          toast.error('Người dùng chưa được xác thực.');
          return;
      }

      setIsSubmitting(true);
      try {
          const response = await axios.delete(
              `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/attachments/${attachmentId}`,
              { headers: { 'Authorization': `Bearer ${user.token}` } }
          );

          if (response.status === 200 || response.status === 204) {
              toast.success('Tệp đính kèm đã được xóa thành công.');
              setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
          } else {
              toast.error('Không thể xóa tệp đính kèm: Lỗi máy chủ.');
          }
      } catch (error) {
          toast.error(`Không thể xóa tệp đính kèm: ${error.response?.data?.message || error.message}`);
      } finally {
          setIsSubmitting(false);
      }
  };
  // --- END File Upload Logic ---
  
  
  // --- Form Submission (MODIFIED PAYLOAD) ---
  const handleSubmitDiagnostic = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation update: CHECK ALL REQUIRED FIELDS
    if (!diagnosticSummary || !initialDiagnosis || !testResults || !repairNotes || !laborHours) {
      toast.warn('Vui lòng điền tất cả các trường văn bản/số bắt buộc.');
      return;
    }
    
    // ===== NEW: Warranty eligibility assessment validation =====
    if (!warrantyEligibilityAssessment || warrantyEligibilityAssessment.trim() === '') {
      toast.warn('Vui lòng nhập "Điều kiện bảo hành được chấp nhận".');
      return;
    }
    
    if (isWarrantyEligible === null) {
      toast.warn('Vui lòng chọn xe có đủ điều kiện bảo hành hay không.');
      return;
    }
    
    // ===== NEW: Repair type specific validation =====
    if (repairType === 'SC_REPAIR') {
      // For SC Repair, service catalog items are required
      if (!serviceCatalogItems || serviceCatalogItems.length === 0) {
        toast.warn('Vui lòng thêm ít nhất một dịch vụ trong phần Đơn giá.');
        return;
      }
      // Third party parts pricing validation
      const invalidParts = requiredParts.filter(p => 
        p.thirdPartyPartId && (!p.unitPrice || p.unitPrice <= 0)
      );
      if (invalidParts.length > 0) {
        toast.warn('Vui lòng nhập giá cho tất cả phụ tùng bên thứ 3.');
        return;
      }
    } else {
      // For EVM Repair, estimated repair cost required
      if (!estimatedRepairCost || parseFloat(estimatedRepairCost) <= 0) {
        toast.warn('Vui lòng nhập chi phí ước tính cho EVM Repair.');
        return;
      }
    }
    
    // NEW REQUIRED FIELD CHECK: readyForSubmission must be true (for EVM Repair)
    if (repairType === 'EVM_REPAIR' && !readyForSubmission) {
      toast.error('Bạn phải chọn "Sẵn sàng Gửi" để hoàn tất và gửi báo cáo chẩn đoán.');
      return;
    }
    
    // ===== NEW: Validate reportedFailure when readyForSubmission is true =====
    if (readyForSubmission && (!reportedFailure || reportedFailure.trim().length < 10)) {
      toast.error('Mô tả lỗi đã báo cáo phải có ít nhất 10 ký tự khi chọn "Sẵn sàng Gửi".');
      return;
    }
    
    if (uploadingFiles.length > 0) {
        toast.warn('Vui lòng đợi tất cả tệp đính kèm tải lên xong trước khi gửi chẩn đoán.');
        return;
    }
    
    const partsUsed = requiredParts
      .filter(part => (part.partId || part.thirdPartyPartId) && part.partName && part.quantity > 0)
      .map(part => {
        if (part.thirdPartyPartId) {
          // Third party part
          return {
            thirdPartyPartId: part.thirdPartyPartId,
            unitPrice: part.unitPrice || 0,
            totalPrice: (part.unitPrice || 0) * part.quantity,
            quantity: Number(part.quantity),
            notes: part.notes || `${part.partName} cần thiết cho sửa chữa.`,
          };
        } else {
          // EVM part
          return {
            partId: Number(part.partId),
            partSerialId: null, 
            quantity: Number(part.quantity),
            notes: part.notes || `${part.partName} cần thiết cho sửa chữa.`,
          };
        }
      });
      
    for (const part of partsUsed) {
        if (isNaN(part.partId) || part.partId <= 0 || part.quantity <= 0) {
            toast.error('Tất cả phụ tùng bắt buộc phải có ID Phụ tùng và Số lượng hợp lệ.');
            return;
        }
    }
    if (requiredParts.length === 1 && !requiredParts[0].partId && !requiredParts[0].partName && requiredParts[0].quantity === 1) {
        partsUsed.length = 0; 
    }
    
    const attachmentPaths = existingAttachments.map(att => att.filePath);


    setIsSubmitting(true);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      // --- STEP 2: Submit Diagnostic Data (COMPREHENSIVE PAYLOAD) ---
      const payload = {
        claimId: claimId,
        diagnosticSummary: diagnosticSummary,
        testResults: testResults,
        repairNotes: repairNotes,
        laborHours: parseFloat(laborHours),
        initialDiagnosis: initialDiagnosis,
        readyForSubmission: repairType === 'EVM_REPAIR' ? readyForSubmission : false,
        diagnosticDetails: diagnosticDetails, 
        warrantyCost: repairType === 'EVM_REPAIR' ? parseFloat(estimatedRepairCost || 0) : 0,
        // ===== NEW: Reported failure description =====
        reportedFailure: reportedFailure,
        // ===== NEW: Warranty eligibility fields =====
        warrantyEligibilityAssessment: warrantyEligibilityAssessment,
        isWarrantyEligible: isWarrantyEligible,
        warrantyEligibilityNotes: warrantyEligibilityNotes,
        // ===== NEW: Repair type and service catalog =====
        repairType: repairType,
        serviceCatalogItems: serviceCatalogItems,
        totalServiceCost: totalServiceCost,
        partsUsed: partsUsed, 
        attachmentPaths: attachmentPaths, 
        diagnosticImages: [], 
      };

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/diagnostic`,
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(`Chẩn đoán cho yêu cầu ${claim.claimNumber} đã được cập nhật và gửi thành công!`);
        handleBackClick(); 
      } else {
        toast.info(`Cập nhật chẩn đoán thành công với mã trạng thái: ${response.status}`);
        handleBackClick();
      }

    } catch (error) {
      let errorMessage = 'Đã xảy ra lỗi khi cập nhật chẩn đoán.';
      if (error.response) {
        errorMessage = error.response.data?.message || `Lỗi: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Không có phản hồi từ máy chủ. Kiểm tra kết nối mạng.';
      } else {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Rendering Helper: Combine files for display (UNMODIFIED) ---
  const filesToRender = [
      ...existingAttachments.map(att => ({ 
          id: att.id,
          name: att.originalFileName || att.fileName || att.filePath?.split('/').pop() || 'Unknown', 
          status: 'uploaded',
          attachment: att // Store full attachment object for download
      })),
      ...uploadingFiles.map(name => ({ 
          id: `temp-${name}`, 
          name, 
          status: 'uploading' 
      }))
  ];


  if (loading) {
    return (
      <div className="udp-page-wrapper">
        <div className="udp-loading-message">Đang tải chi tiết yêu cầu...</div>
      </div>
    );
  }
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isAssigned = claim.assignedTechnician && claim.assignedTechnician.id === user.userId;
  
  if (!isAssigned) {
      return (
          <div className="udp-page-wrapper">
              <div className="udp-error-message">
                  <FaExclamationTriangle className="udp-warning-icon" />
                  Yêu cầu này hiện không được phân công cho bạn. Không được phép cập nhật chẩn đoán.
              </div>
              <div className="udp-back-container">
                  <button onClick={handleBackClick} className="udp-back-button">
                      ← Quay lại Chi tiết Yêu cầu
                  </button>
              </div>
          </div>
      );
  }


  return (
    <motion.div
      className="udp-page-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="udp-page-header">
        <button onClick={handleBackClick} className="udp-back-button">
          ← Quay lại Chi tiết Yêu cầu
        </button>
        <h2 className="udp-page-title">
          Cập nhật Chẩn đoán - Yêu cầu {claim.claimNumber}
        </h2>
      </div>

      <div className="udp-content-area">
        <motion.form 
          onSubmit={handleSubmitDiagnostic}
          className="udp-form-grid"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* ===== NEW: Repair Type Selection ===== */}
          <motion.div className="udp-form-section udp-full-width" variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}>
            <h3 className="udp-section-title">Loại Sửa chữa</h3>
            <div className="udp-form-group">
              <label>Chọn loại sửa chữa *</label>
              <div className="udp-radio-group">
                <label className="udp-radio-label">
                  <input
                    type="radio"
                    name="repairType"
                    value="EVM_REPAIR"
                    checked={repairType === 'EVM_REPAIR'}
                    onChange={(e) => {
                      setRepairType(e.target.value);
                      // Cannot switch from SC_REPAIR to EVM_REPAIR if already SC_REPAIR
                      if (claim?.repairType === 'SC_REPAIR' && e.target.value === 'EVM_REPAIR') {
                        toast.error('Không thể chuyển từ SC Repair sang EVM Repair. Vui lòng hủy claim và tạo mới.');
                        setRepairType('SC_REPAIR');
                        return;
                      }
                    }}
                  />
                  <span>EVM Repair (Bảo hành - EVM chi trả dịch vụ, phụ tùng miễn phí)</span>
                </label>
                <label className="udp-radio-label">
                  <input
                    type="radio"
                    name="repairType"
                    value="SC_REPAIR"
                    checked={repairType === 'SC_REPAIR'}
                    onChange={(e) => setRepairType(e.target.value)}
                  />
                  <span>SC Repair (Khách hàng tự chi trả)</span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* ===== NEW: Warranty Eligibility Assessment ===== */}
          <motion.div className="udp-form-section udp-full-width" variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}>
            <h3 className="udp-section-title">Đánh giá Điều kiện Bảo hành</h3>
            <div className="udp-form-group">
              <label htmlFor="warrantyEligibilityAssessment">Điều kiện bảo hành được chấp nhận *</label>
              <textarea
                id="warrantyEligibilityAssessment"
                value={warrantyEligibilityAssessment}
                onChange={(e) => setWarrantyEligibilityAssessment(e.target.value)}
                placeholder="Nhập đánh giá về điều kiện bảo hành của xe trong claim..."
                required
                rows="4"
              />
            </div>
            <div className="udp-inline-group">
              <div className="udp-form-group">
                <label>Xe có đủ điều kiện bảo hành? *</label>
                <div className="udp-radio-group">
                  <label className="udp-radio-label">
                    <input
                      type="radio"
                      name="isWarrantyEligible"
                      value="true"
                      checked={isWarrantyEligible === true}
                      onChange={() => setIsWarrantyEligible(true)}
                    />
                    <span>Có</span>
                  </label>
                  <label className="udp-radio-label">
                    <input
                      type="radio"
                      name="isWarrantyEligible"
                      value="false"
                      checked={isWarrantyEligible === false}
                      onChange={() => setIsWarrantyEligible(false)}
                    />
                    <span>Không</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="udp-form-group">
              <label htmlFor="warrantyEligibilityNotes">Ghi chú về điều kiện bảo hành</label>
              <textarea
                id="warrantyEligibilityNotes"
                value={warrantyEligibilityNotes}
                onChange={(e) => setWarrantyEligibilityNotes(e.target.value)}
                placeholder="Ghi chú bổ sung..."
                rows="3"
              />
            </div>
          </motion.div>

          {/* Main Diagnostic Fields (Full Width) */}
          <motion.div className="udp-form-section udp-full-width" variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}>
            <h3 className="udp-section-title">Tóm tắt Chẩn đoán & Ghi chú</h3>
            
            {/* Reported Failure Description - Required when readyForSubmission is true */}
            <div className="udp-form-group">
              <label htmlFor="reportedFailure">
                Mô tả Lỗi Đã Báo cáo {readyForSubmission && <span style={{ color: '#ff4444', marginLeft: '0.25rem' }}>*</span>}
              </label>
              <textarea
                id="reportedFailure"
                value={reportedFailure}
                onChange={(e) => setReportedFailure(e.target.value)}
                placeholder="Mô tả chi tiết lỗi đã được báo cáo bởi khách hàng (tối thiểu 10 ký tự khi chọn 'Sẵn sàng Gửi')"
                rows="4"
                required={readyForSubmission}
                minLength={readyForSubmission ? 10 : undefined}
              />
              {readyForSubmission && reportedFailure && reportedFailure.trim().length < 10 && (
                <p className="udp-error-text" style={{ color: '#ff4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Mô tả lỗi phải có ít nhất 10 ký tự.
                </p>
              )}
            </div>
            
            {/* Summary and Initial Diagnosis (Inline group) */}
            <div className="udp-inline-group">
                {/* Diagnostic Summary */}
                <div className="udp-form-group">
                  <label htmlFor="diagnosticSummary">Tóm tắt Chẩn đoán *</label>
                  <input
                    id="diagnosticSummary"
                    type="text"
                    value={diagnosticSummary}
                    onChange={(e) => setDiagnosticSummary(e.target.value)}
                    placeholder="e.g., BMS lỗi, pin không nhận sạc"
                    required
                  />
                </div>

                {/* Initial Diagnosis */}
                <div className="udp-form-group">
                  <label htmlFor="initialDiagnosis">Chẩn đoán Ban đầu *</label>
                  <input
                    id="initialDiagnosis"
                    type="text"
                    value={initialDiagnosis}
                    onChange={(e) => setInitialDiagnosis(e.target.value)}
                    placeholder="ví dụ: Nghi ngờ lỗi bộ pin"
                    required
                  />
                </div>
            </div>

            {/* Test Results & Repair Notes (Stacked, full width) */}
            <div className="udp-inline-group">
                {/* Test Results */}
                <div className="udp-form-group">
                  <label htmlFor="testResults">Kết quả Kiểm tra *</label>
                  <textarea
                    id="testResults"
                    value={testResults}
                    onChange={(e) => setTestResults(e.target.value)}
                    placeholder="ví dụ: OCV thấp, mất cân bằng cell 40mV"
                    required
                    rows="3"
                  />
                </div>
                
                {/* Repair Notes */}
                <div className="udp-form-group">
                  <label htmlFor="repairNotes">Ghi chú Sửa chữa *</label>
                  <textarea
                    id="repairNotes"
                    value={repairNotes}
                    onChange={(e) => setRepairNotes(e.target.value)}
                    placeholder="ví dụ: Đề xuất thay bộ pin"
                    required
                    rows="3"
                  />
                </div>
            </div>

            {/* Full Diagnostic Details */}
            <div className="udp-form-group">
              <label htmlFor="diagnosticDetails">Chi tiết Chẩn đoán (Báo cáo Đầy đủ) *</label>
              <textarea
                id="diagnosticDetails"
                value={diagnosticDetails}
                onChange={(e) => setDiagnosticDetails(e.target.value)}
                placeholder="ví dụ: Các bước chi tiết đã thực hiện cho chẩn đoán và phát hiện đầy đủ..."
                required
                rows="6"
              />
            </div>
            
            {/* Numeric/Control Group (Inline) */}
            {/* REMOVED: Diagnostic Data and Estimated Repair Time fields */}
            <div className="udp-inline-group udp-grouped-fields udp-grouped-fields-reduced">
                {/* Labor Hours */}
                <div className="udp-form-group">
                    <label htmlFor="laborHours">Giờ Lao động *</label>
                    <input
                      id="laborHours"
                      type="number"
                      step="0.1"
                      value={laborHours}
                      onChange={(e) => setLaborHours(e.target.value)}
                      placeholder="2.5"
                      required
                    />
                </div>
                {/* Estimated Repair Cost (only for EVM Repair) */}
                {repairType === 'EVM_REPAIR' && (
                  <div className="udp-form-group">
                    <label htmlFor="estimatedRepairCost">Chi phí Ước tính (₫) *</label>
                    <input
                      id="estimatedRepairCost"
                      type="number"
                      step="0.01"
                      value={estimatedRepairCost}
                      onChange={(e) => setEstimatedRepairCost(e.target.value)}
                      placeholder="250.00"
                      required={repairType === 'EVM_REPAIR'}
                    />
                  </div>
                )}
                {/* Ready For Submission Checkbox (only for EVM Repair) */}
                {repairType === 'EVM_REPAIR' && (
                  <div className="udp-form-group udp-checkbox-group">
                    <label htmlFor="readyForSubmission">
                        <input
                            id="readyForSubmission"
                            type="checkbox"
                            checked={readyForSubmission}
                            onChange={(e) => setReadyForSubmission(e.target.checked)}
                        />
                         Sẵn sàng Gửi *
                    </label>
                    <p className="udp-checkbox-note">Chọn hộp này để hoàn tất báo cáo chẩn đoán.</p>
                  </div>
                )}
                
                {/* Total Cost Display (for SC Repair) */}
                {repairType === 'SC_REPAIR' && (
                  <div className="udp-form-group">
                    <label>Tổng chi phí dự kiến (₫)</label>
                    <div className="udp-total-cost-display">
                      <strong>
                        {(totalServiceCost + requiredParts
                          .filter(p => p.thirdPartyPartId)
                          .reduce((sum, p) => sum + (p.totalPrice || 0), 0)).toLocaleString('vi-VN')} ₫
                      </strong>
                      <small>
                        (Dịch vụ: {totalServiceCost.toLocaleString('vi-VN')} ₫ + 
                        Phụ tùng: {requiredParts
                          .filter(p => p.thirdPartyPartId)
                          .reduce((sum, p) => sum + (p.totalPrice || 0), 0).toLocaleString('vi-VN')} ₫)
                      </small>
                    </div>
                  </div>
                )}
            </div>

          </motion.div>

          {/* ===== NEW: Service Catalog (Don gia) Section - Only for SC Repair ===== */}
          {repairType === 'SC_REPAIR' && (
            <motion.div className="udp-form-section udp-full-width" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <h3 className="udp-section-title">Đơn giá (Dịch vụ) *</h3>
              <div className="udp-service-catalog-section">
                {/* Service Items List */}
                <div className="udp-service-items-list">
                  {serviceCatalogItems.map((item, index) => (
                    <div key={index} className="udp-service-item">
                      <div className="udp-form-group">
                        <label>Dịch vụ</label>
                        <input
                          type="text"
                          value={item.serviceItemName}
                          readOnly
                          className="udp-readonly-input"
                        />
                      </div>
                      <div className="udp-form-group">
                        <label>Đơn giá (₫)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateServiceItem(index, 'unitPrice', e.target.value)}
                          required
                        />
                      </div>
                      <div className="udp-form-group">
                        <label>Số lượng</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateServiceItem(index, 'quantity', e.target.value)}
                          required
                        />
                      </div>
                      <div className="udp-form-group">
                        <label>Thành tiền (₫)</label>
                        <input
                          type="text"
                          value={item.totalPrice.toLocaleString('vi-VN')}
                          readOnly
                          className="udp-readonly-input"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveServiceItem(index)}
                        className="udp-remove-part-btn"
                        title="Xóa Dịch vụ"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add Service Button with Search */}
                <div className="udp-add-service-section">
                  <div className="udp-service-search-container">
                    <input
                      type="text"
                      id="service-search"
                      placeholder="Tìm kiếm dịch vụ..."
                      className="udp-service-search-input"
                      onFocus={(e) => {
                        e.target.nextElementSibling?.classList.add('show');
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          e.target.nextElementSibling?.classList.remove('show');
                        }, 200);
                      }}
                    />
                    <div className="udp-service-search-results">
                      {serviceItems.filter(item => 
                        item.name?.toLowerCase().includes(document.getElementById('service-search')?.value.toLowerCase() || '') ||
                        item.code?.toLowerCase().includes(document.getElementById('service-search')?.value.toLowerCase() || '')
                      ).slice(0, 10).map((item) => (
                        <div
                          key={item.id}
                          className="udp-service-search-result-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAddServiceItem(item);
                            document.getElementById('service-search').value = '';
                            document.getElementById('service-search').nextElementSibling?.classList.remove('show');
                          }}
                        >
                          <p><strong>{item.name}</strong></p>
                          <p>Code: {item.code}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Total Service Cost */}
                <div className="udp-total-service-cost">
                  <strong>Tổng chi phí dịch vụ: {totalServiceCost.toLocaleString('vi-VN')} ₫</strong>
                </div>
              </div>
            </motion.div>
          )}

          {/* Required Parts (Section 2 - Full Width) */}
          <motion.div className="udp-form-section udp-full-width" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
             <h3 className="udp-section-title">
               Phụ tùng Bắt buộc {partDataLoading && ' (Đang tải Danh mục...)'}
               {repairType === 'SC_REPAIR' && ' (Với giá phụ tùng bên thứ 3)'}
             </h3>
            <div className="udp-parts-list" onClick={(e) => e.stopPropagation()}>
              {requiredParts.map((part, index) => (
                <div key={index} className="udp-part-item">
                  
                  {/* Part Name Search - Different for EVM vs Third Party */}
                  {!part.thirdPartyPartId ? (
                    // EVM Parts - Original search
                    <>
                      <div className="udp-form-group part-name-group udp-search-container">
                        <label>Tên Phụ tùng / Tìm kiếm *</label> 
                        <input
                          type="text"
                          value={part.searchQuery} 
                          onChange={(e) => handlePartChange(index, 'searchQuery', e.target.value)}
                          onFocus={() => handleInputFocus(index)}
                          onBlur={() => handleInputBlur(index)}
                          placeholder="ví dụ: Cảm biến Nhiệt độ Pin"
                          required
                          autoComplete="off"
                        />
                        {part.showResults && part.searchQuery.length > 0 && (
                            <div className="udp-search-results">
                                {part.searchResults.length > 0 ? (
                                    part.searchResults.map((result) => (
                                        <div
                                            key={`${result.partId}-${result.partNumber}`}
                                            className="udp-search-result-item"
                                            onMouseDown={(e) => { e.preventDefault(); handlePartSelect(index, result); }} 
                                        >
                                            <p><strong>{result.partName}</strong></p>
                                            <p>ID: {result.partId} | Number: {result.partNumber}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="udp-search-result-item">
                                        <p>Không tìm thấy phụ tùng.</p>
                                    </div>
                                )}
                            </div>
                        )}
                      </div>
                      
                      <div className="udp-form-group part-id-group">
                        <label>ID Phụ tùng *</label> 
                        <input
                          type="number"
                          value={part.partId}
                          onChange={(e) => handlePartChange(index, 'partId', e.target.value)}
                          placeholder="e.g., 6"
                          required
                          min="1"
                        />
                      </div>
                    </>
                  ) : (
                    // Third Party Parts - Search and select
                    <>
                      <div className="udp-form-group part-name-group udp-search-container">
                        <label>Tên Phụ tùng Bên thứ 3 *</label>
                        <input
                          type="text"
                          value={part.searchQuery || part.partName}
                          onChange={(e) => {
                            const query = e.target.value;
                            handlePartChange(index, 'searchQuery', query);
                            // Show search results for third party parts
                            const results = availableThirdPartyParts.filter(p =>
                              p.name?.toLowerCase().includes(query.toLowerCase()) ||
                              p.partNumber?.toLowerCase().includes(query.toLowerCase())
                            );
                            const newParts = [...requiredParts];
                            newParts[index].searchResults = results;
                            newParts[index].showResults = query.length > 0;
                            setRequiredParts(newParts);
                          }}
                          onFocus={() => handleInputFocus(index)}
                          onBlur={() => handleInputBlur(index)}
                          placeholder="Tìm kiếm phụ tùng bên thứ 3..."
                          required
                          autoComplete="off"
                        />
                        {part.showResults && part.searchQuery && (
                          <div className="udp-search-results">
                            {part.searchResults?.length > 0 ? (
                              part.searchResults.map((result) => (
                                <div
                                  key={result.id}
                                  className="udp-search-result-item"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleAddThirdPartyPart(result);
                                  }}
                                >
                                  <p><strong>{result.name}</strong></p>
                                  <p>Giá: {result.unitCost?.toLocaleString('vi-VN')} ₫</p>
                                </div>
                              ))
                            ) : (
                              <div className="udp-search-result-item">
                                <p>Không tìm thấy phụ tùng.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="udp-form-group part-price-group">
                        <label>Đơn giá (₫) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={part.unitPrice || ''}
                          onChange={(e) => handleUpdateThirdPartyPartPrice(index, e.target.value)}
                          placeholder="0.00"
                          required
                          min="0"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="udp-form-group part-quantity-group">
                    <label>Số lượng *</label>
                    <input
                      type="number"
                      min="1"
                      value={part.quantity}
                      onChange={(e) => {
                        const newParts = [...requiredParts];
                        newParts[index].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                        if (part.thirdPartyPartId && newParts[index].unitPrice) {
                          newParts[index].totalPrice = newParts[index].unitPrice * newParts[index].quantity;
                        }
                        setRequiredParts(newParts);
                      }}
                      placeholder="1"
                      required
                    />
                  </div>
                  
                  {/* Total Price for Third Party Parts */}
                  {part.thirdPartyPartId && (
                    <div className="udp-form-group part-total-group">
                      <label>Thành tiền (₫)</label>
                      <input
                        type="text"
                        value={(part.totalPrice || 0).toLocaleString('vi-VN')}
                        readOnly
                        className="udp-readonly-input"
                      />
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => handleRemovePart(index)}
                    className="udp-remove-part-btn"
                    title="Xóa Phụ tùng"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddPart}
              className="udp-add-part-btn"
              disabled={partDataLoading}
            >
              <FaPlus /> Thêm Phụ tùng
            </button>
          </motion.div>
          
          {/* Media Attachment Component (Full Width) */}
          <motion.div 
            className="udp-form-section udp-full-width" 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <h3 className="udp-section-title">Tệp đính kèm Phương tiện</h3> 
            
            <input 
                type="file"
                ref={fileInputRef}
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }} // Hide native input
                id="file-upload"
            />
            
            {/* Custom Upload Button */}
            <button 
                type="button" 
                className="udp-add-part-btn"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={isSubmitting} // Disable file select if main form is submitting
            >
                <FaUpload /> Chọn Tệp để Tải lên
            </button>
            
            {/* File List Display */}
            <div className="udp-file-list">
                
                {filesToRender.map((file) => (
                    <div 
                        key={file.id || file.name} 
                        className={`udp-file-item ${file.status === 'uploaded' ? 'udp-existing-file' : 'udp-uploading-file'}`}
                    >
                        {file.status === 'uploading' ? (
                            <FaUpload className="udp-file-icon udp-icon-spin" />
                        ) : (
                            <FaFileAlt className="udp-file-icon" />
                        )}
                        
                        <span 
                            className={`udp-file-name ${file.status === 'uploaded' ? 'udp-download-link' : ''}`}
                            onClick={file.status === 'uploaded' ? () => handleDownloadAttachment(file.attachment) : null} 
                            title={file.status === 'uploaded' ? `Nhấp để tải xuống ${file.name}` : file.name}
                        >
                            {file.name}
                        </span>

                        {/* Status Badge */}
                        <span className="udp-file-status">
                            {file.status === 'uploaded' ? 'Đã tải lên' : 'Đang tải lên...'}
                        </span>

                        {/* Remove/Delete Button */}
                        <button 
                            type="button" 
                            onClick={file.status === 'uploaded' ? () => handleDeleteAttachment(file.id) : null}
                            className="udp-file-remove-btn"
                            title={file.status === 'uploaded' ? 'Xóa Tệp' : 'Không thể xóa trong khi tải lên'}
                            disabled={!file.id || isSubmitting} // Disable if no ID (means it's uploading) or submitting main form
                        >
                            <FaTimesCircle />
                        </button>
                    </div>
                ))}
                
                {/* Placeholder if no files are present/queued */}
                {filesToRender.length === 0 && (
                    <div className="udp-placeholder-box udp-file-info-box">
                        <p>Hiện không có tệp phương tiện nào được đính kèm hoặc được chọn để tải lên.</p>
                    </div>
                )}
            </div>
          </motion.div>

          {/* Submit Button (Full Width) */}
          <motion.div 
            className="udp-submit-area udp-full-width"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <button
              type="submit"
              className="udp-submit-button"
              disabled={isSubmitting || partDataLoading || uploadingFiles.length > 0} 
            >
              <FaSave /> {isSubmitting ? 'Đang gửi...' : 'Gửi Chẩn đoán'}
            </button>
          </motion.div>
        </motion.form>
      </div>
    </motion.div>
  );
};

export default UpdateDiagnosticPage;