{ pkgs, config, ... }:

{
  # https://devenv.sh/basics/
  env.ADMINER_URL = "127.0.0.1:2023";

  # Enables .env file support
  dotenv.enable = true;
  dotenv.filename = ".env";

  packages = [ pkgs.bun pkgs.openssl ];

  services = {
    # enable mailpit email
    mailpit = { enable = true; };

    # enable mysql
    mysql = {
      enable = true;
      # package = pkgs.mysql80;
      initialDatabases = [{ name = "${config.env.DB_DATABASE}"; }];
      ensureUsers = [{
        name = "${config.env.DB_USER}";
        password = "${config.env.DB_PASSWORD}";
        ensurePermissions = {
          "${config.env.DB_DATABASE}.*" = "ALL PRIVILEGES";
        };
      }];
      settings.mysqld.port = "${config.env.DB_PORT}";
    };
  };

  # enable adminer to manage DB things
  services.adminer.enable = true;
  services.adminer.listen = "${config.env.ADMINER_URL}";

  enterShell = ''
    if [[ ! -d node_modules ]]; then
        bun install
    fi
      export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
      export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines}/bin/query-engine"
      export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines}/lib/libquery_engine.node"
      export PRISMA_INTROSPECTION_ENGINE_BINARY="${pkgs.prisma-engines}/bin/introspection-engine"
      export PRISMA_FMT_BINARY="${pkgs.prisma-engines}/bin/prisma-fmt"
  '';

  # https://devenv.sh/languages/
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs-18_x;
  };

  # Start the frontend server
  # processes.start-prisma-gen.exec = "bunx prisma generate";
  processes.start-frontend.exec = "bun run start";

}
