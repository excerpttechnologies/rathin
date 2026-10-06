const Customer = require("../models/Customer");

// Create new customer
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        message: "Customer with this email already exists",
      });
    }

    // Create new customer
    const customer = new Customer({
      name,
      email,
      password,
    });

    await customer.save();

    res.status(201).json({
      id: customer._id,
      name: customer.name,
      email: customer.email,
      password: customer.password,
      createdAt: customer.createdAt,
    });
  } catch (error) {
    console.error("Error creating customer check:", error);
    res.status(500).json({
      message: "Server error new customer add while creating customer",
    });
  }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 }).lean();

    const formattedCustomers = customers.map((customer) => ({
      id: customer._id,
      name: customer.name,
      email: customer.email,
      password: customer.password,
      createdAt: customer.createdAt,
    }));

    res.json(formattedCustomers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      message: "Server error while fetching customers gerAllCustomers",
    });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({
      id: customer._id,
      name: customer.name,
      email: customer.email,
      password: customer.password,
      createdAt: customer.createdAt,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      message: "Server error while fetching customer",
    });
  }
};
