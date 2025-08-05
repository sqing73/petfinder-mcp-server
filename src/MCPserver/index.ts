import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Age, Coat, Gender, Size, Sort } from "../petfinder/types";
import { PetfinderClient } from "../petfinder";
import minimist from "minimist";

export const LocationSchema = z.union([
    z.object({
        city: z.string(),
        state: z.string(),
    }),
    z.object({
        latitude: z.string(),
        longitude: z.string(),
    }),
    z.object({
        zipcode: z.string(),
    })
]);

export async function startServer(): Promise<void> {
    const args = minimist(process.argv.slice(2));
    const petfinder = PetfinderClient.getInstance(args.apiKey, args.secretKey);
    const animalTypes = await petfinder.getAnimalTypes();
    const server = new McpServer({
        name: "petfinder-mcp-server",
        version: "1.0.0",
        capabilities: {
            tools: {},
            resources: {},
        }
    });

    const generateOptionGuides = (options: Record<string, string | number> | string[]) => `must be one of [${Object.values(options).join(",")}]`

    server.tool(
        "search_adoptable_animals",
        "search for adoptable animals using the Petfinder API",
        {
            type: z.string().describe(generateOptionGuides(Object.values(animalTypes).map(type => type.name))),
            location: LocationSchema,
            age: z.string().optional().describe(generateOptionGuides(Age)),
            gender: z.string().optional().describe(generateOptionGuides(Gender)),
            coat: z.string().optional().describe(generateOptionGuides(Coat)),
            color: z.string().optional(),
            breed: z.string().optional(),
            size: z.string().optional().describe(generateOptionGuides(Size)),
            good_with_children: z.boolean().optional().describe("whether the animal is good with children"),
            good_with_dogs: z.boolean().optional().describe("whether the animal is good with dogs"),
            good_with_cats: z.boolean().optional().describe("whether the animal is good with cats"),
            house_trained: z.boolean().optional().describe("whether the animal is house trained"),
            declawed: z.boolean().optional().describe("whether the animal is declawed"),
            special_needs: z.boolean().optional().describe("whether the animal has special needs"),
            distance: z.number().optional().describe("distance in miles"),
            sort: z.nativeEnum(Sort).optional().describe("Attribute to sort by; leading dash requests a reverse-order sort."),
            before: z.string().optional().describe("Must be a valid ISO8601 date-time string (e.g. 2019-10-07T19:13:01+00:00)"),
            after: z.string().optional().describe("Must be a valid ISO8601 date-time string (e.g. 2019-10-07T19:13:01+00:00)"),
        },
        async (params) => {
            const { location, ...petfinderParams } = params;
            const { type, color, breed } = petfinderParams;
            // Validate animal type exists
            const animalType = animalTypes.find(t => t.name.toLowerCase() === type.toLowerCase());
            if (!animalType) {
                return {
                    content: [{
                        type: "text",
                        text: `Animal type "${type}" not found. Available types: ${animalTypes.map(t => t.name).join(", ")}`,
                    }],
                };
            }

            // Validate location
            if (location && "zipcode" in location) {
                if (!/^\d{5}(-\d{4})?$/.test(location.zipcode)) {
                    return {
                        content: [{
                            type: "text",
                            text: `Invalid ZIP code: ${location.zipcode}`,
                        }],
                    };
                }
            }

            // Validate color against animal type
            if (color) {
                const animalColor = animalType.colors?.find(c => c.toLowerCase() === color.toLowerCase());
                if (!animalColor) {
                    return {
                        content: [{
                            type: "text",
                            text: `Color "${color}" is not valid for ${type}. Available colors: ${animalType.colors.join(", ")}`,
                        }],
                    };
                }
            }

            // Validate breed against animal type
            if (breed) {
                const animalBreed = animalType.breeds?.find(b => b.toLowerCase() === breed.toLowerCase());
                if (!animalBreed) {
                    return {
                        content: [{
                            type: "text",
                            text: `Breed "${breed}" is not valid for ${type}. Available breeds: ${animalType.breeds?.join(", ")}`,
                        }],
                    };
                }
            }

            (petfinderParams as any).location = "zipcode" in location ? location.zipcode : location;

            try {
                const animals = await petfinder.searchAnimals(petfinderParams as any);
                if (animals.length === 0) {
                    return {
                        content: [{
                            type: "text",
                            text: "No cats found",
                        }],
                    };
                }
                animals.map(({ photos, primary_photo_cropped, ...rest }) => rest);;
                return {
                    content: [{
                        type: "text",
                        text: `Animals found: ${JSON.stringify(animals)}.
                        Please recommend at least three animals from the result.
                        Each recommendation must include the corresponding url.
                        Ask the user if they need help to draft an email to reach out to shelter. 
                        If yes, collect some information from user before drafting the email`,
                    }],
                };

            } catch (err) {
                return {
                    content: [{
                        type: "text",
                        text: "Failed to search for adoptable animals, reason:" + err,
                    }]
                }
            }
        },
    );

    server.prompt(
        "user_information_collector_for_shelter_email",
        "collect some user information before drafting the email to shelter",
        {},
        async () => {
            return {
                messages: [
                    {
                        role: "assistant",
                        content: {
                            type: "text",
                            text: `Collect the following information from the user:
                            Preferred animals from the recommendations
                            Whether they have children
                            Whether they have cats
                            Whether they have dogs
                            Whether they have kids visiting frequently
                            Whether this is their first time owning a pet
                            Whether they are renting or own their house
                            Let the user know that this information is not mandatory but encourage them to provide as much as possible.
                            Once the information is gathered, use it to write a polite and warm email to the shelter.`
                        }
                    }
                ]
            }
        }
    )

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Server started");
}
