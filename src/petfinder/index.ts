import axios, { AxiosInstance } from "axios";
import { 
    Gender, 
    Coat, 
    Color, 
    Location, 
    Status, 
    Age, 
    Animal, 
    AuthenticateResponse, 
    GetAnimalTypesResponse, 
    BreedResponse, 
    AnimalType, 
    SearchAnimalsResponse, 
    MultipleSize, 
    Sort,
} from "./types";

interface ClientConfig {
    apiKey: string;
    secretKey: string;
    bearerToken?: string;
    bearerTokenExpiresAt?: Date;
}

export interface IPetfinderClient {
    searchAnimals(params: {
        type: string;
        location?: Location;
        size?: MultipleSize;
        age?: Age;
        gender?: Gender;
        coat?: Coat;
        color?: Color;
        status?: Status;
        limit?: number;
        good_with_children?: boolean;
        good_with_dogs?: boolean;
        good_with_cats?: boolean;
        house_trained?: boolean;
        declawed?: boolean;
        special_needs?: boolean;
        distance?: number;
        before?: string;
        after?: string;
    }): Promise<Animal[]>;
}

export class PetfinderClient implements IPetfinderClient {
    private static instance: PetfinderClient | null = null;
    public http: AxiosInstance;
    private config: ClientConfig;
    private animalTypes: AnimalType[] = [];

    private constructor(config: ClientConfig) {
        this.config = config;
        this.http = axios.create({
            baseURL: "https://api.petfinder.com",
        });
    }

    public static getInstance(apiKey: string, secretKey: string): PetfinderClient {
        if (PetfinderClient.instance) {
            return PetfinderClient.instance;
        }
        if (!apiKey || !secretKey) {
            throw new Error("API key and secret key are required");
        }
        PetfinderClient.instance = new PetfinderClient({ apiKey, secretKey });
        return PetfinderClient.instance;
    }

    private async authenticate() {
        if (this.config.bearerToken && this.config.bearerTokenExpiresAt && this.config.bearerTokenExpiresAt > new Date()) {
            return;
        }

        try {
            const response = await this.http.post<AuthenticateResponse>("/v2/oauth2/token", {
                grant_type: "client_credentials",
                client_id: this.config.apiKey,
                client_secret: this.config.secretKey,
            });

            this.config.bearerToken = response.data.access_token;
            this.config.bearerTokenExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);
            this.http.interceptors.request.use((config) => {
                config.headers.Authorization = `Bearer ${this.config.bearerToken}`;
                return config;
            });
        } catch (error) {
            console.error("Failed to authenticate with Petfinder API:", error);
            throw new Error("Failed to authenticate with Petfinder API");
        }
    }

    public async searchAnimals(params: {
        type: string;
        location: Location;
        size?: MultipleSize;
        age?: Age;
        gender?: Gender;
        coat?: Coat;
        color?: Color;
        breed?: string;
        status?: Status;
        limit?: number;
        good_with_children?: boolean;
        good_with_dogs?: boolean;
        good_with_cats?: boolean;
        house_trained?: boolean;
        declawed?: boolean;
        special_needs?: boolean;
        distance?: number;
        sort?: Sort;
        before?: string;
        after?: string;
    }): Promise<Animal[]> {
        try {
            await this.authenticate();

            if (params.location) {
                const location = typeof params.location === "string" ? params.location : Object.values(params.location).join(", ");
                params.location = location;
            }

            const response = await this.http.get<SearchAnimalsResponse>("/v2/animals", {
                params: {
                    distance: 10,
                    status: Status.Adoptable,
                    ...params,
                    size: params.size?.join(","),
                    limit: 10,
                },
            });

            return response.data.animals;
        } catch (error) {
            console.error("Failed to search animals:", error);
            throw new Error("Failed to search animals");
        }
    }

    public async getAnimalTypes(): Promise<AnimalType[]> {
        if (this.animalTypes.length > 0) {
            return this.animalTypes;
        }
        try {
            await this.authenticate();

            const response = await this.http.get<GetAnimalTypesResponse>("/v2/types");
            for (const resp of response.data.types) {
                const breedsResponse = await this.http.get<BreedResponse>(resp._links.breeds.href);
                const breeds = breedsResponse.data.breeds.map((breed) => breed.name);
                resp.breeds = breeds;
            }

            this.animalTypes = response.data.types;
            return this.animalTypes;
        } catch (error) {
            console.error("Failed to get animal types:", error);
            throw new Error("Failed to get animal types");
        }
    }
}
