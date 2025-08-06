# MCP server to for pet adoption

A Model Context Protocol (MCP) server that helps users find adoptable pets through the Petfinder API.

## 🐾 Features

- **Pet Search**: Search for adoptable animals using various criteria (type, location, age, breed, etc.)
- **Smart Validation**: Validates search parameters against available animal types, breeds, and colors
- **Location Support**: Search by city/state, zipcode, or latitude/longitude coordinates
- **Adoption Assistance**: Collects user information and helps draft personalized emails to shelters
- **MCP Integration**: Built as a Model Context Protocol server for seamless AI assistant integration

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Petfinder API credentials

### Get Petfinder API Credentials

You'll need Petfinder API credentials to use this server:

1. Create an account at [Petfinder for Developers](https://www.petfinder.com/developers/)
2. Create a new application to get your API key and secret

### Usage Options

#### Option 1: Using Claude Desktop (Recommended)

1. Add the pet adoption server to your `claude_desktop_config.json`:
    ```json
    {
      "mcpServers": {
        "PetAdoptionFinder": {
          "command": "npx",
          "args": [
            "pet-adoption-mcp",
            "--apiKey",
            "YOUR_API_KEY",
            "--secretKey",
            "YOUR_SECRET_KEY"
          ]
        }
      }
    }
    ```
2. Replace `YOUR_API_KEY` with your Petfinder API `client_id`
3. Replace `YOUR_SECRET_KEY` with your Petfinder API `client_secret`
4. Restart Claude Desktop

#### Option 2: Local Development

For developers who want to run it locally:

1. Clone the repository:
```bash
git clone https://github.com/sqing73/mcp-server-for-pet-adoption.git
cd mcp-server-for-pet-adoption
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Add the pet adoption server to your `claude_desktop_config.json`:
    ```json
    {
      "mcpServers": {
        "PetAdoptionFinder": {
          "command": "node",
          "args": [
            "/PATH/dist/index.js",
            "--apiKey",
            "YOUR_API_KEY",
            "--secretKey",
            "YOUR_SECRET_KEY"
          ]
        }
      }
    }
    ```
5. Replace `PATH` with your path to `mcp-server-for-pet-adoption`
6. Replace `YOUR_API_KEY` with your Petfinder API `client_id`
7. Replace `YOUR_SECRET_KEY` with your Petfinder API `client_secret`
8. Restart Claude Desktop

## 🔧 API Reference

### Search Adoptable Animals

The main tool provided by this server is `search_adoptable_animals`, which accepts the following parameters:

#### Required Parameters
- `type`: Animal type (e.g., "Dog", "Cat", "Rabbit", etc.)
- `location`: Search location in one of these formats:
  - `{ city: "New York", state: "NY" }`
  - `{ zipcode: "10001" }`
  - `{ latitude: "40.7128", longitude: "-74.0060" }`

#### Optional Parameters
- `age`: Animal age (`baby`, `young`, `adult`, `senior`)
- `gender`: Animal gender (`male`, `female`)
- `coat`: Coat type (`short`, `medium`, `long`, `wire`, `hairless`, `curly`)
- `color`: Animal color (validated against available colors for the animal type)
- `breed`: Animal breed (validated against available breeds for the animal type)
- `size`: Animal size (`small`, `medium`, `large`, `xlarge`)
- `good_with_children`: Boolean - whether the animal is good with children
- `good_with_dogs`: Boolean - whether the animal is good with dogs
- `good_with_cats`: Boolean - whether the animal is good with cats
- `house_trained`: Boolean - whether the animal is house trained
- `declawed`: Boolean - whether the animal is declawed
- `special_needs`: Boolean - whether the animal has special needs
- `distance`: Number - search radius in miles (default: 10)
- `sort`: Sort order (`recent`, `distance`, `-recent`, `-distance`)
- `before`/`after`: ISO8601 date-time strings for filtering by publication date

### User Information Collection

The server also provides a prompt `user_information_collector_for_shelter_email` that helps collect user information for drafting shelter contact emails. It gathers:

- Preferred animals from recommendations
- Household information (children, other pets)
- Pet ownership experience
- Housing situation (renting vs. owning)

## 🛠️ Development

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Watch mode for development
- `npm start`: Run the compiled server

## 📝 Example Usage

The server is designed to work with AI assistants that support the Model Context Protocol. When integrated, users can ask questions like:

- "Find adoptable dogs near New York City"
- "Show me small cats that are good with children"
- "Search for senior dogs in zipcode 90210"

The server will validate the request, search the Petfinder API, and provide recommendations with relevant information and URLs.

## 📸 Demo

### Claude Desktop Comparison

| With MCP Server | Without MCP Server |
|----------------|-------------------|
| ![Claude Desktop with MCP Server](https://raw.githubusercontent.com/sqing73/mcp-server-for-pet-adoption/main/assets/ClaudeDesktopWithMCPServer.png) | ![Claude Desktop without MCP Server](https://raw.githubusercontent.com/sqing73/mcp-server-for-pet-adoption/main/assets/ClaudeDesktopWithNoMCPServer.png) |

### Video Demonstration

[Watch Demo Video](https://github.com/sqing73/mcp-server-for-pet-adoption/raw/refs/heads/main/assets/ClaudeDesktopWithMCPServerVideo.mov)

## 🙏 Acknowledgments

This project is made possible by the [Petfinder API](https://www.petfinder.com/developers/), which provides comprehensive data about adoptable pets from thousands of animal shelters and rescue organizations across the United States and Canada.

- **Petfinder API**: For providing the extensive database of adoptable animals and shelter information
- **Petfinder Organization**: For their mission to help pets find loving homes
- **Animal Shelters & Rescues**: For their tireless work in caring for and rehoming animals

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Petfinder API Documentation](https://www.petfinder.com/developers/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Petfinder for Developers](https://www.petfinder.com/developers/)
