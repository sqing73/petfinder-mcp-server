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
                        text: `
                        You are an expert in recommending adoptable animals based on the user's search criteria. You excel at finding the best matches for users looking to adopt pets.
                        Recommend at least three animals from the search results based on the user's preferences and include the url for each animal. Ask the user if 
                        1. they need help to draft an email to reach out to shelter at the end. If yes, collect some information from user before drafting the email.
                        2. they want to learn more about the animals.
                        Your search results should helper user to find the best match for their needs.
                        Create a bullet-point list of the recommended animals that focuses on the user's preferences.
                        The recommendations are for people who are looking to adopt a pet.
                        Example:
                        <user>
                        I am looking for a cat that is good with children and dogs, and I live in San Francisco.
                        </user>
                        <data>
                        {"id": 77830183, "organization_id": "CA912", "url": "https://www.petfinder.com/cat/yale-77830183/ca/milpitas/humane-society-silicon-valley-ca912/?referrer_id=bdb3e282-b9fb-4460-9be2-ab2573475b0b&utm_source=api&utm_medium=partnership&utm_content=bdb3e282-b9fb-4460-9be2-ab2573475b0b", "type": "Cat", "species": "Cat", "breeds": {"primary": "Domestic Medium Hair", "secondary": null, "mixed": true, "unknown": false}, "colors": {"primary": null, "secondary": null, "tertiary": null}, "age": "Baby", "gender": "Male", "size": "Small", "coat": null, "attributes": {"spayed_neutered": false, "house_trained": false, "declawed": false, "special_needs": false, "shots_current": true}, "environment": "environment": {"children": true, "dogs": null, "cats": true}, "tags": [], "name": "Yale", "description": "Hello! Are you looking for a social kitty who loves getting showered with attention? Look no further, because I&amp;#39;m your...", "organization_animal_id": "228201", "photos": [], "primary_photo_cropped": null, "videos": [], "status": "adoptable", "status_changed_at": "2025-08-17T06:40:48+0000", "published_at": "2025-08-17T06:40:47+0000", "distance": 10.3587, "contact": {"email": "adoptions@hssv.org", "phone": "(408) 262-2133", "address": {"address1": "901 Ames Ave.", "address2": null, "city": "Milpitas", "state": "CA", "postcode": "95035", "country": "US"}}, "_links": {"self": {"href": "/v2/animals/77830183"}, "type": {"href": "/v2/types/cat"}, "organization": {"href": "/v2/organizations/ca912"}}}
                        <data>
                        <assistant>
                        We have found the following animals that match your criteria:
                        1. Yale - A baby Domestic Medium Hair cat, good with children and cats. [View Yale](https://www.petfinder.com/cat/yale-77830183/ca/milpitas/humane-society-silicon-valley-ca912/?referrer_id=bdb3e282-b9fb-4460-9be2-ab2573475b0b&utm_source=api&utm_medium=partnership&utm_content=bdb3e282-b9fb-4460-9be2-ab2573475b0b)
                        Do you need help drafting an email to the shelter to inquire about this animal? If so, I can collect some information from you before drafting the email. Or would you like to learn more about the animals?
                        <assistant>
                        Animals found: ${JSON.stringify(animals)}.
                        `,
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
                            text: `
                            You are the expert in collecting user information to draft an email to the shelter.
                            Collect the following information from the user:
                            Preferred animals from the recommendations
                            Whether they have children
                            Whether they have cats
                            Whether they have dogs
                            Whether they have kids visiting frequently
                            Whether this is their first time owning a pet
                            Whether they are renting or own their house
                            Create a bullet-point list of the questions you need to ask the user.
                            The collected information will be used to draft an email to the shelter to query about the animals and introduce the user.
                            The tone should be friendly and professional.
                            `
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
