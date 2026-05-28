
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


export interface Teacher {
    id: number;
    name: string;
    format: (0 | 1)[]; 
    subjects: string[];
} export const FORMAT_LABELS: Record<number, string> = { 0: "Online", 1: "Face to face"};


export const UKRAINIAN_REGIONS = [
    " -- none -- ", 
    " Autonomous Republic of Crimea",
    " Cherkasy",
    " Chernivtsi",
    " Chernihiv",
    " Dnipro",
    " Donetsk",
    " Ivano-Frankivsk",
    " Kharkiv",
    " Kherson",
    " Khmelnytskyi",
    " Kirovohrad",
    " Kyiv",
    " Lviv",
    " Luhansk",
    " Mykolaiv",
    " Odesa",
    " Poltava",
    " Rivne",
    " Sumy",
    " Ternopil",
    " Vinnytsia",
    " Volyn",
    " Zakarpattia",
    " Zaporizhzhia",
    " Zhytomyr",
];


export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";


export const termsAndConditionsText: string = `

    TERMS OF USE FOR THE ALEX SERVICE

  1. GENERAL PROVISIONS
 By using the Alex service, you agree to these terms. 
 The service is provided ‘"as is"’. 
 We do not guarantee 100% accuracy of AI responses. 
 It is prohibited to use the service for illegal activities.

  2. PROHIBITED:
    - Spam and mass mailings;
    - Harassment and intimidation of other users;
    - Illegal activities of any kind;
    - Misuse of AI capabilities for malicious purposes;
    - Distribution of malicious software;
    - Copyright infringement.

  3. USER RIGHTS
 The user has the right to:
    - Access their data;
    - Delete their account;
    - Change their personal details;
    - Stop using the service at any time;
    - Edit their profile;
    - Export their data;
    - Know what data is stored and for what purpose.

  4. USER OBLIGATIONS
 The user is obliged to:
    - Provide accurate information upon registration;
    - Not disclose confidential information;
    - Report security breaches;
    - Adhere to ethical standards for the use of AI.

  5. PRIVACY
 We collect and process your data in accordance with our privacy
 policy.
 Your data is protected and will not be shared with third parties
 without your consent.

  6. LIABILITY
 The Alex service is not liable for:
    - Incorrect AI responses;
    - Data loss due to technical issues;
    - The actions of other users. 
     
  7. CHANGES TO THE TERMS
 We may amend these terms at any time.
 Your continued use of the service after such changes 
 constitutes your agreement to the new terms.

 By agreeing to these terms and conditions, 
 you confirm and accept all the above provisions.
`;


export const Study: Teacher[] = [
    {
        id: 1,
        name: "Doctor Alina Marchlewska",
        format: [0, 1],
        subjects: ["Wprowadzenie do metor munerycznych", " Metody probabilistyczne i statystyczne w informatyce", "Analiza matematychna i numerychna"]
    },
    {
        id: 2,
        name: "Wiśniewska Dorota",
        format: [0],
        subjects: ["Język obcy"]
    },
    {
        id: 3,
        name: "Magister Sobocińska Magdalena",
        format: [0],
        subjects: ["Język obcy"]
    },
    {
        id: 4,
        name: "Magister Kaflińska Agnieszka",
        format: [0, 1],
        subjects: ["Język obcy"]
    },
    {
        id: 5,
        name: "Doktor inżynier Goetzen Piotr",
        format: [0],
        subjects: ["Projektowanie okablowania strukturalnego", "Administracja sieciami Linux", "Sieci komputerowe", "Systemy operacyjne Informaty"]
    },
    {
        id: 6,
        name: "Magister inżynier Szelejak Andrzej",
        format: [0],
        subjects: ["Administracja sieciami Linux"]
    },
    {
        id: 7,
        name: "Doktor inżynier Józef Paszkowski",
        format: [0],
        subjects: ["Bazy danych", "Problemy społeczne i zawodowe", "Problemy społeczne i zawodowe"]
    },
    {
        id: 8,
        name: "Doktor inżynier Grzanek Konrad",
        format: [0],
        subjects: ["Programowanie i konfiguracja serwerów aplikacyjnych", "Języki i paradygmaty programowania", "Programowanie funkcyjne", "Programowanie i konfiguracja serwerów aplikacyjnych"]
    },
    {
        id: 9,
        name: "Doktor Przybyszewski Krzysztof, Profesor SAN",
        format: [0],
        subjects: ["Projektowanie uniwersalne a dostępność w cyberprzestrzeni", "Podstawy grafiki komputerowej"]
    },
    {
        id: 10,
        name: "Magister Herman Andrzej",
        format: [1],
        subjects: ["Bazy danych", "Programowanie i konfiguracja serwerów aplikacyjnyc"]
    },
    {
        id: 11,
        name: "Magister inżynier Gumiński Krystian",
        format: [1],
        subjects: ["Języki i paradygmaty programowania"]
    },
    {
        id: 12,
        name: "Doktor inżynier Jan Makuch",
        format: [1],
        subjects: ["Wprowadzenie do metod numerycznych"]
    },
    {
        id: 13,
        name: "Filutowicz Zbigniew",
        format: [0],
        subjects: ["Wybrane Środowiska Programistyczne"]
    },
    {
        id: 14,
        name: "Siwocha Agnieszka",
        format: [1],
        subjects: [" Podstawy grafiki komputerowej"]
    },
    {
        id: 15,
        name: "Matusiak Marek",
        format: [0, 1],
        subjects: [" Technologie internetu rzeczy"]
    }
];

