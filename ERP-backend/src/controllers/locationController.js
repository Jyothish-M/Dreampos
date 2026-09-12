import { Country, State, City } from "../models/Location.js";

/* GET /api/locations/countries */
export const getCountries = async (req, res) => {
    try {
        const { search, status } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { name: new RegExp(search, "i") },
                { code: new RegExp(search, "i") }
            ];
        }
        if (status) query.status = status;

        const countries = await Country.find(query).sort({ name: 1 });

        res.json({
            message: "Countries Retrieved Successfully",
            status: true,
            dataFound: countries.length > 0,
            data: countries.map(c => ({
                id: c._id,
                label: c.name,
                value: c.name,
                name: c.name,
                code: c.code,
                phoneCode: c.phoneCode,
                status: c.status
            }))
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to retrieve countries",
            status: false,
            dataFound: false
        });
    }
};

/* GET /api/locations/states */
export const getStates = async (req, res) => {
    try {
        const { countryCode, search, status } = req.query;

        const query = {};
        if (countryCode) {
            // Find country by code or name
            const country = await Country.findOne({
                $or: [{ code: countryCode }, { name: countryCode }]
            });
            if (country) {
                query.countryCode = country.code;
            } else {
                query.countryCode = countryCode;
            }
        }
        if (search) {
            query.$or = [
                { name: new RegExp(search, "i") },
                { stateCode: new RegExp(search, "i") }
            ];
        }
        if (status) query.status = status;

        const states = await State.find(query).sort({ name: 1 });

        res.json({
            message: "States Retrieved Successfully",
            status: true,
            dataFound: states.length > 0,
            data: states.map(s => ({
                id: s._id,
                label: s.name,
                value: s.name,
                name: s.name,
                stateCode: s.stateCode,
                countryCode: s.countryCode,
                status: s.status
            }))
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to retrieve states",
            status: false,
            dataFound: false
        });
    }
};

/* GET /api/locations/cities */
export const getCities = async (req, res) => {
    try {
        const { countryCode, stateCode, search, status } = req.query;

        const query = {};
        if (countryCode) {
            const country = await Country.findOne({
                $or: [{ code: countryCode }, { name: countryCode }]
            });
            if (country) query.countryCode = country.code;
            else query.countryCode = countryCode;
        }
        if (stateCode) {
            const stateQuery = {
                $or: [{ stateCode: stateCode }, { name: stateCode }]
            };
            if (query.countryCode) stateQuery.countryCode = query.countryCode;

            const state = await State.findOne(stateQuery);
            if (state && state.stateCode) query.stateCode = state.stateCode;
            else query.stateCode = stateCode;
        }
        if (search) {
            query.name = new RegExp(search, "i");
        }
        if (status) query.status = status;

        const cities = await City.find(query).sort({ name: 1 });

        res.json({
            message: "Cities Retrieved Successfully",
            status: true,
            dataFound: cities.length > 0,
            data: cities.map(c => ({
                id: c._id,
                label: c.name,
                value: c.name,
                name: c.name,
                stateCode: c.stateCode,
                countryCode: c.countryCode,
                status: c.status
            }))
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to retrieve cities",
            status: false,
            dataFound: false
        });
    }
};


