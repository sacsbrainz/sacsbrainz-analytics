FROM oven/bun:latest

# Set the working directory
WORKDIR /app

# Copy the rest of the application code
COPY . .

# Install project dependencies
RUN bun install

# Generate Prisma client
RUN bun x prisma generate


# Expose the port on which the Node.js application will run
EXPOSE 2020

# Command to start the Node.js application
CMD [ "bun", "start" ]