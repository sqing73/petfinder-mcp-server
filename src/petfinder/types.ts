export type Location = {
    city: string;
    state: string;
} | {
    latitude: string;
    longitude: string;
} | string;

export enum Size {
    Small = "small",
    Medium = "medium",
    Large = "large",
    XLarge = "xlarge"
}

export interface MultipleSize extends Array<Size> {}


export enum Age {
    Baby = "baby",
    Young = "young",
    Adult = "adult",
    Senior = "senior"
}

export enum Gender {
    Male = "male",
    Female = "female"
}

export enum Coat {
    Short = "short",
    Medium = "medium",
    Long = "long",
    Wire = "wire",
    Hairless = "hairless",
    Curly = "curly"
}

export enum Sort {
    Recent = "recent",
    Distance = "distance",
    ReversedRecent = "-recent",
    ReversedDistance = "-distance",
}

export type Color = string;

export enum Status {
    Adoptable = "adoptable",
    Pending = "pending",
    Adopted = "adopted"
}

export type Photo = {
    small: string;
    medium: string;
    large: string;
    full: string;
}
export type Animal = {
    id: number;
    organization_id: string;
    url: string;
    type: string;
    species: string;
    breeds: {
        primary: string;
        secondary: string | null;
        mixed: boolean;
        unknown: boolean;
    };
    colors: {
        primary: string;
        secondary: string | null;
        tertiary: string | null;
    };
    age: Age;
    gender: Gender;
    size: Size;
    coat: Coat;
    name: string;
    description: string;
    photos: Array<Photo>;
    videos: Array<{
        embed: string;
    }>;
    status: Status;
    attributes: {
        spayed_neutered: boolean;
        house_trained: boolean;
        declawed: boolean;
        special_needs: boolean;
        shots_current: boolean;
    };
    environment: {
        children: boolean;
        dogs: boolean;
        cats: boolean;
    };
    tags: string[];
    contact: {
        email: string;
        phone: string;
        address: {
            address1: string;
            address2: string;
            city: string;
            state: string;
            postcode: string;
            country: string;
        };
    };
    published_at: string;
    distance: number;
    primary_photo_cropped: Array<Photo>;
}

export interface SearchAnimalsResponse {
    animals: Array<Animal & {
        _links: {
            self: {
                href: string;
            };
            type: {
                href: string;
            };
            organization: {
                href: string;
            };
        };
    }>;
    pagination: {
        count_per_page: number;
        total_count: number;
        current_page: number;
        total_pages: number;
    };
}

export interface AuthenticateResponse {
    token_type: string;
    expires_in: number;
    access_token: string;
}

export interface ErrorResponse {
    type: string;
    status: number;
    title: string;
    detail: string;
    "invalid-params": Array<{
        in: string;
        path: string;
        message: string;
    }>;
}

export interface BreedResponse {
    breeds: Array<{
        name: string;
        _links: {
            type: {
                href: string;
            };
        };
    }>;
}

export interface AnimalType {
    name: string;
    coats: string[];
    colors: string[];
    genders: string[];
    breeds?: string[];
}

export interface GetAnimalTypesResponse {
    types: Array<AnimalType & {
        _links: {
            self: {
                href: string;
            };
            breeds: {
                href: string;
            };
        };
    }>;
}
