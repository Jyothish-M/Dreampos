import mongoose from "mongoose";
import dotenv from "dotenv";
import { Country, State, City } from "../models/Location.js";

dotenv.config();

const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);

        await Country.deleteMany({});
        await State.deleteMany({});
        await City.deleteMany({});

        // Countries
        const countries = [
            { name: "India", code: "IN", phoneCode: "+91" },
            { name: "United States", code: "US", phoneCode: "+1" },
            { name: "United Kingdom", code: "GB", phoneCode: "+44" },
            { name: "Canada", code: "CA", phoneCode: "+1" },
            { name: "Australia", code: "AU", phoneCode: "+61" },
            { name: "United Arab Emirates", code: "AE", phoneCode: "+971" },
            { name: "Germany", code: "DE", phoneCode: "+49" },
            { name: "France", code: "FR", phoneCode: "+33" },
            { name: "Japan", code: "JP", phoneCode: "+81" },
            { name: "China", code: "CN", phoneCode: "+86" },
            { name: "Singapore", code: "SG", phoneCode: "+65" }
        ];

        // Indian States
        const indianStates = [
            { name: "Andhra Pradesh", countryCode: "IN", stateCode: "AP" },
            { name: "Arunachal Pradesh", countryCode: "IN", stateCode: "AR" },
            { name: "Assam", countryCode: "IN", stateCode: "AS" },
            { name: "Bihar", countryCode: "IN", stateCode: "BR" },
            { name: "Chhattisgarh", countryCode: "IN", stateCode: "CG" },
            { name: "Goa", countryCode: "IN", stateCode: "GA" },
            { name: "Gujarat", countryCode: "IN", stateCode: "GJ" },
            { name: "Haryana", countryCode: "IN", stateCode: "HR" },
            { name: "Himachal Pradesh", countryCode: "IN", stateCode: "HP" },
            { name: "Jharkhand", countryCode: "IN", stateCode: "JH" },
            { name: "Karnataka", countryCode: "IN", stateCode: "KA" },
            { name: "Kerala", countryCode: "IN", stateCode: "KL" },
            { name: "Madhya Pradesh", countryCode: "IN", stateCode: "MP" },
            { name: "Maharashtra", countryCode: "IN", stateCode: "MH" },
            { name: "Manipur", countryCode: "IN", stateCode: "MN" },
            { name: "Meghalaya", countryCode: "IN", stateCode: "ML" },
            { name: "Mizoram", countryCode: "IN", stateCode: "MZ" },
            { name: "Nagaland", countryCode: "IN", stateCode: "NL" },
            { name: "Odisha", countryCode: "IN", stateCode: "OR" },
            { name: "Punjab", countryCode: "IN", stateCode: "PB" },
            { name: "Rajasthan", countryCode: "IN", stateCode: "RJ" },
            { name: "Sikkim", countryCode: "IN", stateCode: "SK" },
            { name: "Tamil Nadu", countryCode: "IN", stateCode: "TN" },
            { name: "Telangana", countryCode: "IN", stateCode: "TG" },
            { name: "Tripura", countryCode: "IN", stateCode: "TR" },
            { name: "Uttar Pradesh", countryCode: "IN", stateCode: "UP" },
            { name: "Uttarakhand", countryCode: "IN", stateCode: "UK" },
            { name: "West Bengal", countryCode: "IN", stateCode: "WB" },
            { name: "Delhi", countryCode: "IN", stateCode: "DL" }
        ];

        // US States
        const usStates = [
            { name: "California", countryCode: "US", stateCode: "CA" },
            { name: "Texas", countryCode: "US", stateCode: "TX" },
            { name: "Florida", countryCode: "US", stateCode: "FL" },
            { name: "New York", countryCode: "US", stateCode: "NY" },
            { name: "Pennsylvania", countryCode: "US", stateCode: "PA" },
            { name: "Illinois", countryCode: "US", stateCode: "IL" },
            { name: "Ohio", countryCode: "US", stateCode: "OH" },
            { name: "Georgia", countryCode: "US", stateCode: "GA" },
            { name: "North Carolina", countryCode: "US", stateCode: "NC" },
            { name: "Michigan", countryCode: "US", stateCode: "MI" }
        ];

        // Australian States 
        const australianStates = [
            { name: "New South Wales", countryCode: "AU", stateCode: "NSW" },
            { name: "Victoria", countryCode: "AU", stateCode: "VIC" },
            { name: "Queensland", countryCode: "AU", stateCode: "QLD" },
            { name: "Western Australia", countryCode: "AU", stateCode: "WA" },
            { name: "South Australia", countryCode: "AU", stateCode: "SA" },
            { name: "Tasmania", countryCode: "AU", stateCode: "TAS" },
            { name: "Australian Capital Territory", countryCode: "AU", stateCode: "ACT" },
            { name: "Northern Territory", countryCode: "AU", stateCode: "NT" }
        ];

        // UAE Emirates
        const uaeEmirates = [
            { name: "Abu Dhabi", countryCode: "AE", stateCode: "AZ" },
            { name: "Dubai", countryCode: "AE", stateCode: "DU" },
            { name: "Sharjah", countryCode: "AE", stateCode: "SH" },
            { name: "Ajman", countryCode: "AE", stateCode: "AJ" },
            { name: "Umm Al Quwain", countryCode: "AE", stateCode: "UQ" },
            { name: "Ras Al Khaimah", countryCode: "AE", stateCode: "RK" },
            { name: "Fujairah", countryCode: "AE", stateCode: "FU" }
        ];

        // UK Countries
        const ukRegions = [
            { name: "England", countryCode: "GB", stateCode: "ENG" },
            { name: "Scotland", countryCode: "GB", stateCode: "SCT" },
            { name: "Wales", countryCode: "GB", stateCode: "WLS" },
            { name: "Northern Ireland", countryCode: "GB", stateCode: "NIR" }
        ];

        // Canada Provinces
        const canadaProvinces = [
            { name: "Ontario", countryCode: "CA", stateCode: "ON" },
            { name: "Quebec", countryCode: "CA", stateCode: "QC" },
            { name: "British Columbia", countryCode: "CA", stateCode: "BC" },
            { name: "Alberta", countryCode: "CA", stateCode: "AB" },
            { name: "Manitoba", countryCode: "CA", stateCode: "MB" }
        ];

        // Germany States
        const germanyStates = [
            { name: "Bavaria", countryCode: "DE", stateCode: "BY" },
            { name: "Berlin", countryCode: "DE", stateCode: "BE" },
            { name: "Hamburg", countryCode: "DE", stateCode: "HH" },
            { name: "Hesse", countryCode: "DE", stateCode: "HE" }
        ];

        // Singapore (treated as a city-state)
        const singaporeStates = [
            { name: "Singapore", countryCode: "SG", stateCode: "SG" }
        ];

        const states = [
            ...indianStates,
            ...usStates,
            ...australianStates,
            ...uaeEmirates,
            ...ukRegions,
            ...canadaProvinces,
            ...germanyStates,
            ...singaporeStates
        ];

        // Cities
        const cities = [
            // Maharashtra cities
            { name: "Mumbai", stateCode: "MH", countryCode: "IN" },
            { name: "Pune", stateCode: "MH", countryCode: "IN" },
            { name: "Nagpur", stateCode: "MH", countryCode: "IN" },
            { name: "Nashik", stateCode: "MH", countryCode: "IN" },
            { name: "Aurangabad", stateCode: "MH", countryCode: "IN" },
            { name: "Solapur", stateCode: "MH", countryCode: "IN" },
            { name: "Amravati", stateCode: "MH", countryCode: "IN" },
            { name: "Kolhapur", stateCode: "MH", countryCode: "IN" },
            { name: "Akola", stateCode: "MH", countryCode: "IN" },
            { name: "Thane", stateCode: "MH", countryCode: "IN" },

            // Karnataka cities
            { name: "Bangalore", stateCode: "KA", countryCode: "IN" },
            { name: "Mysore", stateCode: "KA", countryCode: "IN" },
            { name: "Mangalore", stateCode: "KA", countryCode: "IN" },
            { name: "Hubli", stateCode: "KA", countryCode: "IN" },
            { name: "Belgaum", stateCode: "KA", countryCode: "IN" },
            { name: "Gulbarga", stateCode: "KA", countryCode: "IN" },
            { name: "Davanagere", stateCode: "KA", countryCode: "IN" },
            { name: "Bellary", stateCode: "KA", countryCode: "IN" },
            { name: "Tumkur", stateCode: "KA", countryCode: "IN" },
            { name: "Udupi", stateCode: "KA", countryCode: "IN" },
            { name: "Shimoga", stateCode: "KA", countryCode: "IN" },
            { name: "Hassan", stateCode: "KA", countryCode: "IN" },
            { name: "Bidar", stateCode: "KA", countryCode: "IN" },
            { name: "Raichur", stateCode: "KA", countryCode: "IN" },

            //Kerala
            { name: "Kochi", stateCode: "KL", countryCode: "IN" },
            { name: "Thiruvananthapuram", stateCode: "KL", countryCode: "IN" },
            { name: "Kozhikode", stateCode: "KL", countryCode: "IN" },
            { name: "Thrissur", stateCode: "KL", countryCode: "IN" },

            // Tamil Nadu cities
            { name: "Chennai", stateCode: "TN", countryCode: "IN" },
            { name: "Coimbatore", stateCode: "TN", countryCode: "IN" },
            { name: "Madurai", stateCode: "TN", countryCode: "IN" },
            { name: "Tiruchirappalli", stateCode: "TN", countryCode: "IN" },
            { name: "Salem", stateCode: "TN", countryCode: "IN" },
            { name: "Tiruppur", stateCode: "TN", countryCode: "IN" },
            { name: "Erode", stateCode: "TN", countryCode: "IN" },
            { name: "Vellore", stateCode: "TN", countryCode: "IN" },

            // Delhi
            { name: "New Delhi", stateCode: "DL", countryCode: "IN" },
            { name: "Delhi", stateCode: "DL", countryCode: "IN" },
            { name: "Gurgaon", stateCode: "DL", countryCode: "IN" },
            { name: "Noida", stateCode: "DL", countryCode: "IN" },

            // Gujarat cities
            { name: "Ahmedabad", stateCode: "GJ", countryCode: "IN" },
            { name: "Surat", stateCode: "GJ", countryCode: "IN" },
            { name: "Vadodara", stateCode: "GJ", countryCode: "IN" },
            { name: "Rajkot", stateCode: "GJ", countryCode: "IN" },
            { name: "Bhavnagar", stateCode: "GJ", countryCode: "IN" },
            { name: "Jamnagar", stateCode: "GJ", countryCode: "IN" },

            // Rajasthan cities
            { name: "Jaipur", stateCode: "RJ", countryCode: "IN" },
            { name: "Jodhpur", stateCode: "RJ", countryCode: "IN" },
            { name: "Udaipur", stateCode: "RJ", countryCode: "IN" },
            { name: "Kota", stateCode: "RJ", countryCode: "IN" },
            { name: "Bikaner", stateCode: "RJ", countryCode: "IN" },
            { name: "Ajmer", stateCode: "RJ", countryCode: "IN" },

            // Andhra Pradesh
            { name: "Visakhapatnam", stateCode: "AP", countryCode: "IN" },
            { name: "Vijayawada", stateCode: "AP", countryCode: "IN" },
            { name: "Guntur", stateCode: "AP", countryCode: "IN" },
            { name: "Nellore", stateCode: "AP", countryCode: "IN" },

            // Telangana
            { name: "Hyderabad", stateCode: "TG", countryCode: "IN" },
            { name: "Warangal", stateCode: "TG", countryCode: "IN" },
            { name: "Nizamabad", stateCode: "TG", countryCode: "IN" },

            // West Bengal cities
            { name: "Kolkata", stateCode: "WB", countryCode: "IN" },
            { name: "Howrah", stateCode: "WB", countryCode: "IN" },
            { name: "Durgapur", stateCode: "WB", countryCode: "IN" },
            { name: "Siliguri", stateCode: "WB", countryCode: "IN" },

            // Uttar Pradesh cities
            { name: "Lucknow", stateCode: "UP", countryCode: "IN" },
            { name: "Kanpur", stateCode: "UP", countryCode: "IN" },
            { name: "Agra", stateCode: "UP", countryCode: "IN" },
            { name: "Varanasi", stateCode: "UP", countryCode: "IN" },
            { name: "Meerut", stateCode: "UP", countryCode: "IN" },
            { name: "Ghaziabad", stateCode: "UP", countryCode: "IN" },
            { name: "Prayagraj", stateCode: "UP", countryCode: "IN" },
            { name: "Bareilly", stateCode: "UP", countryCode: "IN" },

            // Bihar
            { name: "Patna", stateCode: "BR", countryCode: "IN" },
            { name: "Gaya", stateCode: "BR", countryCode: "IN" },
            { name: "Bhagalpur", stateCode: "BR", countryCode: "IN" },

            // Madhya Pradesh
            { name: "Indore", stateCode: "MP", countryCode: "IN" },
            { name: "Bhopal", stateCode: "MP", countryCode: "IN" },
            { name: "Jabalpur", stateCode: "MP", countryCode: "IN" },
            { name: "Gwalior", stateCode: "MP", countryCode: "IN" },

            // Punjab & Haryana
            { name: "Chandigarh", stateCode: "PB", countryCode: "IN" },
            { name: "Ludhiana", stateCode: "PB", countryCode: "IN" },
            { name: "Amritsar", stateCode: "PB", countryCode: "IN" },
            { name: "Jalandhar", stateCode: "PB", countryCode: "IN" },
            { name: "Faridabad", stateCode: "HR", countryCode: "IN" },
            { name: "Gurgaon", stateCode: "HR", countryCode: "IN" },

            // California cities
            { name: "Los Angeles", stateCode: "CA", countryCode: "US" },
            { name: "San Francisco", stateCode: "CA", countryCode: "US" },
            { name: "San Diego", stateCode: "CA", countryCode: "US" },
            { name: "San Jose", stateCode: "CA", countryCode: "US" },
            { name: "Sacramento", stateCode: "CA", countryCode: "US" },
            { name: "Long Beach", stateCode: "CA", countryCode: "US" },

            // New York cities
            { name: "New York City", stateCode: "NY", countryCode: "US" },
            { name: "Buffalo", stateCode: "NY", countryCode: "US" },
            { name: "Rochester", stateCode: "NY", countryCode: "US" },
            { name: "Yonkers", stateCode: "NY", countryCode: "US" },

            // Texas cities
            { name: "Houston", stateCode: "TX", countryCode: "US" },
            { name: "Dallas", stateCode: "TX", countryCode: "US" },
            { name: "Austin", stateCode: "TX", countryCode: "US" },
            { name: "San Antonio", stateCode: "TX", countryCode: "US" },
            { name: "Fort Worth", stateCode: "TX", countryCode: "US" },
            { name: "El Paso", stateCode: "TX", countryCode: "US" },

            // Florida cities
            { name: "Miami", stateCode: "FL", countryCode: "US" },
            { name: "Orlando", stateCode: "FL", countryCode: "US" },
            { name: "Tampa", stateCode: "FL", countryCode: "US" },
            { name: "Jacksonville", stateCode: "FL", countryCode: "US" },
            { name: "Tallahassee", stateCode: "FL", countryCode: "US" },

            // UK Cities
            { name: "London", stateCode: "ENG", countryCode: "GB" },
            { name: "Manchester", stateCode: "ENG", countryCode: "GB" },
            { name: "Birmingham", stateCode: "ENG", countryCode: "GB" },
            { name: "Liverpool", stateCode: "ENG", countryCode: "GB" },
            { name: "Edinburgh", stateCode: "SCT", countryCode: "GB" },
            { name: "Glasgow", stateCode: "SCT", countryCode: "GB" },
            { name: "Cardiff", stateCode: "WLS", countryCode: "GB" },
            { name: "Belfast", stateCode: "NIR", countryCode: "GB" },

            // Canada Cities
            { name: "Toronto", stateCode: "ON", countryCode: "CA" },
            { name: "Ottawa", stateCode: "ON", countryCode: "CA" },
            { name: "Montreal", stateCode: "QC", countryCode: "CA" },
            { name: "Vancouver", stateCode: "BC", countryCode: "CA" },
            { name: "Calgary", stateCode: "AB", countryCode: "CA" },
            { name: "Edmonton", stateCode: "AB", countryCode: "CA" },

            // Australia Cities
            { name: "Sydney", stateCode: "NSW", countryCode: "AU" },
            { name: "Melbourne", stateCode: "VIC", countryCode: "AU" },
            { name: "Brisbane", stateCode: "QLD", countryCode: "AU" },
            { name: "Perth", stateCode: "WA", countryCode: "AU" },
            { name: "Adelaide", stateCode: "SA", countryCode: "AU" },

            // UAE Cities
            { name: "Dubai", stateCode: "DU", countryCode: "AE" },
            { name: "Abu Dhabi", stateCode: "AZ", countryCode: "AE" },
            { name: "Sharjah", stateCode: "SH", countryCode: "AE" },
            { name: "Ajman", stateCode: "AJ", countryCode: "AE" },

            // Germany Cities
            { name: "Munich", stateCode: "BY", countryCode: "DE" },
            { name: "Berlin", stateCode: "BE", countryCode: "DE" },
            { name: "Hamburg", stateCode: "HH", countryCode: "DE" },
            { name: "Frankfurt", stateCode: "HE", countryCode: "DE" },

            // Singapore
            { name: "Singapore City", stateCode: "SG", countryCode: "SG" }
        ];

        // Insert data
        await Country.insertMany(countries);
        await State.insertMany(states);
        await City.insertMany(cities);

        console.log("Locations seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding locations:", error);
        process.exit(1);
    }
};

seedData();
