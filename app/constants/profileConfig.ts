
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
