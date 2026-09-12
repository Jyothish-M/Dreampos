import express from "express";
import {
    getStores,
    getWarehouses,
    getSellingTypes,
    getBarcodeSymbologies,
    getBrands,
    getUnits,
    getWarranties,
    getCategories,
    getSubcategoriesByCategory
} from "../controllers/dropdownController.js";

const router = express.Router();

// These are simple GET-only dropdown routes — no CRUD needed
router.get("/stores", getStores);
router.get("/warehouses", getWarehouses);
router.get("/selling-types", getSellingTypes);
router.get("/barcode-symbology", getBarcodeSymbologies);
router.get("/brands", getBrands);
router.get("/units", getUnits);
router.get("/warranties", getWarranties);
router.get("/categories", getCategories);
router.get("/categories/:id/subcategories", getSubcategoriesByCategory);

export default router;
