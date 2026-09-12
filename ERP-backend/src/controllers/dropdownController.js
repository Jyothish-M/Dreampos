import Store from "../models/Store.js";
import Warehouse from "../models/Warehouse.js";
import SellingType from "../models/SellingType.js";
import BarcodeSymbology from "../models/BarcodeSymbology.js";
import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";
import Brand from "../models/Brand.js";
import Unit from "../models/Unit.js";
import Warranty from "../models/Warranty.js";

// GET /api/stores
export const getStores = async (req, res) => {
    try {
        const stores = await Store.find({ status: "Active" }).sort({ name: 1 }).select("_id name");
        res.status(200).json({
            message: "Stores Retrieved Successfully",
            status: true,
            data: stores.map(s => ({ id: s._id, name: s.name }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET /api/warehouses
export const getWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.find({ status: "Active" }).sort({ name: 1 }).select("_id name");
        res.status(200).json({
            message: "Warehouses Retrieved Successfully",
            status: true,
            data: warehouses.map(w => ({ id: w._id, name: w.name }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET /api/selling-types
export const getSellingTypes = async (req, res) => {
    try {
        const types = await SellingType.find({ status: "Active" }).sort({ name: 1 }).select("_id name");
        res.status(200).json({
            message: "Selling Types Retrieved Successfully",
            status: true,
            data: types.map(t => ({ id: t._id, name: t.name }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET /api/barcode-symbology
export const getBarcodeSymbologies = async (req, res) => {
    try {
        const items = await BarcodeSymbology.find({ status: "Active" }).sort({ name: 1 }).select("_id name");
        res.status(200).json({
            message: "Barcode Symbology Retrieved Successfully",
            status: true,
            data: items.map(b => ({ id: b._id, name: b.name }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET /api/brands  (simple dropdown list)
export const getBrands = async (req, res) => {
    try {
        const brands = await Brand.find({ status: "Active" }).sort({ name: 1 }).select("_id name");
        res.status(200).json({
            message: "Brands Retrieved Successfully",
            status: true,
            data: brands.map(b => ({ id: b._id, name: b.name }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET /api/units  (simple dropdown list)
export const getUnits = async (req, res) => {
    try {
        const units = await Unit.find({ status: "Active" }).sort({ name: 1 }).select("_id name shortName");
        res.status(200).json({
            message: "Units Retrieved Successfully",
            status: true,
            data: units.map(u => ({ id: u._id, name: u.name }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET /api/warranties  (simple dropdown list)
export const getWarranties = async (req, res) => {
    try {
        const warranties = await Warranty.find({ status: "Active" }).sort({ name: 1 });
        res.status(200).json({
            message: "Warranties Retrieved Successfully",
            status: true,
            data: warranties.map(w => ({
                id: w._id,
                name: w.name,
                duration: w.duration,
                type: w.type,
                description: w.description,
                status: w.status
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET /api/categories  (simple dropdown list)
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ status: "Active" }).sort({ name: 1 }).select("_id name status");
        res.status(200).json({
            message: "Categories Retrieved Successfully",
            status: true,
            data: categories.map(c => ({ id: c._id, name: c.name, status: c.status }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};

// GET /api/categories/:id/subcategories
export const getSubcategoriesByCategory = async (req, res) => {
    try {
        const subcategories = await Subcategory.find({ categoryId: req.params.id, status: "Active" })
            .sort({ name: 1 })
            .select("_id name categoryId");

        res.status(200).json({
            message: "Sub Categories Retrieved Successfully",
            status: true,
            data: subcategories.map(s => ({ id: s._id, name: s.name, categoryId: s.categoryId }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message, status: false });
    }
};
