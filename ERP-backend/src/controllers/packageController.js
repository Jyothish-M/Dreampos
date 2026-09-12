import Package from "../models/Package.js";

/* GET /api/packages */
export const getPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isDeleted: { $ne: true } }).sort({ position: 1 });
    res.json({
      message: "Packages Found Successfully",
      status: true,
      dataFound: true,
      data: packages,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch packages",
      status: false,
      dataFound: false,
    });
  }
};

/* POST /api/packages */
export const addPackage = async (req, res) => {
  try {
    const newPackage = new Package(req.body);
    const savedPackage = await newPackage.save();
    res.status(201).json({
      message: "Package Added Successfully",
      status: true,
      dataFound: true,
      data: savedPackage,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to add package",
      status: false,
      dataFound: false,
    });
  }
};

/* PUT /api/packages/:id */
export const updatePackage = async (req, res) => {
  try {
    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPackage) {
      return res.status(404).json({
        message: "Package not found",
        status: false,
        dataFound: false,
      });
    }
    res.json({
      message: "Package Updated Successfully",
      status: true,
      dataFound: true,
      data: updatedPackage,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update package",
      status: false,
      dataFound: false,
    });
  }
};

/* DELETE /api/packages/:id */
export const deletePackage = async (req, res) => {
  try {
    const deletedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!deletedPackage) {
      return res.status(404).json({
        message: "Package not found",
        status: false,
        dataFound: false,
      });
    }
    res.json({
      message: "Package Deleted Successfully",
      status: true,
      dataFound: true,
      data: deletedPackage,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete package",
      status: false,
      dataFound: false,
    });
  }
};
