// const ServiceRequest = require('../models/ServiceRequest');

// // Create new service request
// exports.createServiceRequest = async (req, res) => {
//   try {
//     const {
//       serviceType,
//       priority,
//       description,
//       address,
//       preferredDate,
//       preferredTime,
//       customerId,
//       customerName,
//       customerEmail
//     } = req.body;

//     // Validate required fields
//     if (!serviceType || !description || !address || !customerId || !customerName || !customerEmail) {
//       return res.status(400).json({
//         success: false,
//         message: 'All required fields must be provided'
//       });
//     }
//     console.log("📩 Incoming Body:", req.body);

//     const serviceRequest = new ServiceRequest({
//       serviceType,
//       priority,
//       description,
//       address,
//       preferredDate: preferredDate || null,
//       preferredTime: preferredTime || '',
//       customerId,
//       customerName,
//       customerEmail,
//       status: 'pending'
//     });

//     await serviceRequest.save();

//     res.status(201).json({
//       _id: serviceRequest._id,
//       id: serviceRequest._id.toString(),
//       serviceType: serviceRequest.serviceType,
//       priority: serviceRequest.priority,
//       description: serviceRequest.description,
//       address: serviceRequest.address,
//       preferredDate: serviceRequest.preferredDate,
//       preferredTime: serviceRequest.preferredTime,
//       status: serviceRequest.status,
//       customerId: serviceRequest.customerId,
//       customerName: serviceRequest.customerName,
//       customerEmail: serviceRequest.customerEmail,
//       createdAt: serviceRequest.createdAt
//     });

//   } catch (error) {
//     console.error('Error creating service request:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while creating service request'
//     });
//   }
// };

// // Get all service requests for a specific customer
// exports.getCustomerServiceRequests = async (req, res) => {
//   try {
//     const { customerId } = req.params;

//     const serviceRequests = await ServiceRequest.find({ customerId })
//       .sort({ createdAt: -1 });

//     const formattedRequests = serviceRequests.map(request => ({
//       _id: request._id,
//       id: request._id.toString(),
//       serviceType: request.serviceType,
//       priority: request.priority,
//       description: request.description,
//       address: request.address,
//       preferredDate: request.preferredDate,
//       preferredTime: request.preferredTime,
//       status: request.status,
//       customerId: request.customerId,
//       customerName: request.customerName,
//       customerEmail: request.customerEmail,
//       createdAt: request.createdAt
//     }));

//     res.json(formattedRequests);

//   } catch (error) {
//     console.error('Error fetching service requests:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching service requests'
//     });
//   }
// };

// // Get all service requests (for admin)
// exports.getAllServiceRequests = async (req, res) => {
//   try {
//     const serviceRequests = await ServiceRequest.find()
//       .sort({ createdAt: -1 });

//     const formattedRequests = serviceRequests.map(request => ({
//       _id: request._id,
//       id: request._id.toString(),
//       serviceType: request.serviceType,
//       priority: request.priority,
//       description: request.description,
//       address: request.address,
//       preferredDate: request.preferredDate,
//       preferredTime: request.preferredTime,
//       status: request.status,
//       customerId: request.customerId,
//       customerName: request.customerName,
//       customerEmail: request.customerEmail,
//       createdAt: request.createdAt,
//       assignedTo: request.assignedTo,
//       notes: request.notes
//     }));

//     res.json(formattedRequests);

//   } catch (error) {
//     console.error('Error fetching service requests:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching service requests'
//     });
//   }
// };

// // Update service request status
// exports.updateServiceRequestStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, notes, assignedTo } = req.body;

//     const serviceRequest = await ServiceRequest.findByIdAndUpdate(
//       id,
//       {
//         status,
//         ...(notes && { notes }),
//         ...(assignedTo && { assignedTo })
//       },
//       { new: true }
//     );

//     if (!serviceRequest) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service request not found'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Service request updated successfully',
//       serviceRequest: {
//         _id: serviceRequest._id,
//         id: serviceRequest._id.toString(),
//         serviceType: serviceRequest.serviceType,
//         priority: serviceRequest.priority,
//         description: serviceRequest.description,
//         address: serviceRequest.address,
//         preferredDate: serviceRequest.preferredDate,
//         preferredTime: serviceRequest.preferredTime,
//         status: serviceRequest.status,
//         customerId: serviceRequest.customerId,
//         customerName: serviceRequest.customerName,
//         customerEmail: serviceRequest.customerEmail,
//         createdAt: serviceRequest.createdAt
//       }
//     });

//   } catch (error) {
//     console.error('Error updating service request:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while updating service request'
//     });
//   }
// };

const ServiceRequest = require("../models/ServiceRequest");

// Create new service request
exports.createServiceRequest = async (req, res) => {
  try {
    const {
      serviceType,
      priority,
      description,
      address,
      preferredDate,
      preferredTime,
      customerId,
      customerName,
      customerEmail,
      complaintImages = [],
    } = req.body;

    // Validate required fields
    if (
      !serviceType ||
      !description ||
      !address ||
      !customerId ||
      !customerName ||
      !customerEmail
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }
    // console.log("📩 Incoming Body:", req.body);

    const serviceRequest = new ServiceRequest({
      serviceType,
      priority: priority || "medium",
      description,
      address,
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || "",
      customerId,
      customerName,
      customerEmail,
      complaintImages,
      status: "pending",
    });

    await serviceRequest.save();

    res.status(201).json({
      _id: serviceRequest._id,
      id: serviceRequest._id.toString(),
      serviceType: serviceRequest.serviceType,
      priority: serviceRequest.priority,
      description: serviceRequest.description,
      address: serviceRequest.address,
      preferredDate: serviceRequest.preferredDate,
      preferredTime: serviceRequest.preferredTime,
      status: serviceRequest.status,
      customerId: serviceRequest.customerId,
      customerName: serviceRequest.customerName,
      customerEmail: serviceRequest.customerEmail,
      complaintImages: serviceRequest.complaintImages,
      createdAt: serviceRequest.createdAt,
    });
  } catch (error) {
    console.error("Error creating service request:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating service request",
    });
  }
};

// Get all service requests for a specific customer
exports.getCustomerServiceRequests = async (req, res) => {
  try {
    const { customerId } = req.params;

    // .lean() returns plain objects: these handlers only read and reshape
    // the rows, so building full Mongoose documents was wasted work.
    const serviceRequests = await ServiceRequest.find({ customerId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedRequests = serviceRequests.map((request) => ({
      _id: request._id,
      id: request._id.toString(),
      serviceType: request.serviceType,
      priority: request.priority,
      description: request.description,
      address: request.address,
      preferredDate: request.preferredDate,
      preferredTime: request.preferredTime,
      status: request.status,
      customerId: request.customerId,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      complaintImages: request.complaintImages,
      createdAt: request.createdAt,
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error("Error fetching service requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching service requests",
    });
  }
};

// Get all service requests (for admin) - Updated
exports.getAllServiceRequests = async (req, res) => {
  try {
    const serviceRequests = await ServiceRequest.find()
      .sort({ createdAt: -1 })
      .lean();

    const formattedRequests = serviceRequests.map((request) => ({
      _id: request._id,
      id: request._id.toString(),
      serviceType: request.serviceType,
      priority: request.priority,
      description: request.description,
      address: request.address,
      preferredDate: request.preferredDate,
      preferredTime: request.preferredTime,
      status: request.status,
      customerId: request.customerId,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      complaintImages: request.complaintImages,
      createdAt: request.createdAt,
      assignedTo: request.assignedTo,
      notes: request.notes,
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error("Error fetching service requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching service requests",
    });
  }
};

// Update service request status - Updated
exports.updateServiceRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, assignedTo } = req.body;

    const serviceRequest = await ServiceRequest.findByIdAndUpdate(
      id,
      {
        status,
        ...(notes && { notes }),
        ...(assignedTo && { assignedTo }),
      },
      { new: true },
    );

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    res.json({
      success: true,
      message: "Service request updated successfully",
      serviceRequest: {
        _id: serviceRequest._id,
        id: serviceRequest._id.toString(),
        serviceType: serviceRequest.serviceType,
        priority: serviceRequest.priority,
        description: serviceRequest.description,
        address: serviceRequest.address,
        preferredDate: serviceRequest.preferredDate,
        preferredTime: serviceRequest.preferredTime,
        status: serviceRequest.status,
        customerId: serviceRequest.customerId,
        customerName: serviceRequest.customerName,
        customerEmail: serviceRequest.customerEmail,
        complaintImages: serviceRequest.complaintImages,
        createdAt: serviceRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating service request:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating service request",
    });
  }
};
