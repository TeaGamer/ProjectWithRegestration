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
    "All Ukraine",
    "Kyiv",
    "Kharkiv",
    "Odesa",
    "Dnipro",
    "Lviv",
    "Zaporizhzhia",
    "Mykolaiv",
    "Donetsk",
    "Luhansk",
    "Kherson",
    "Chernihiv",
    "Cherkasy",
    "Poltava",
    "Sumy",
    "Vinnytsia",
    "Rivne",
    "Zhytomyr",
    "Khmelnytskyi",
    "Ternopil",
    "Ivano-Frankivsk",
    "Volyn",
];

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:10000";
