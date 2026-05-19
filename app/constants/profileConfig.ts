
export interface User {
    id: number;
    login: string;
    email: string;
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    region?: string;
    avatar?: string;
}

export const UKRAINIAN_REGIONS = [
    "Autonomous Republic of Crimea",
    "Cherkasy",
    "Chernivtsi",
    "Chernihiv",
    "Dnipro",
    "Donetsk",
    "Ivano-Frankivsk",
    "Kharkiv",
    "Kherson",
    "Khmelnytskyi",
    "Kirovohrad",
    "Kyiv",
    "Lviv",
    "Luhansk",
    "Mykolaiv",
    "Odesa",
    "Poltava",
    "Rivne",
    "Sumy",
    "Ternopil",
    "Vinnytsia",
    "Volyn",
    "Zakarpattia",
    "Zaporizhzhia",
    "Zhytomyr",
];

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
