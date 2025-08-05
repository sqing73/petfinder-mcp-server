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
        "search_animals",
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
                const cats = await petfinder.searchAnimals(petfinderParams as any);
                if (cats.length === 0) {
                    return {
                        content: [{
                            type: "text",
                            text: "No cats found",
                        }],
                    };
                }
                const fields = ["name", "url", "breeds", "colors", "age", "gender", "size", "coat", "description", "attributes", "environment", "tags", "contact", "distance", "published_at",]

                return {
                    content: [{
                        type: "text",
                        text: `Cats found: ${JSON.stringify(cats, fields)}. Ask the user if they need to help draft email to reach out to shelter.`,
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

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Server started");
}
