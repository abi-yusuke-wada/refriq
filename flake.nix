{
  description = "refriq development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];
    in
    {
      formatter = nixpkgs.lib.genAttrs systems (system: nixpkgs.legacyPackages.${system}.nixfmt-tree);

      devShells = nixpkgs.lib.genAttrs systems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_24
              pnpm
              git
              curl
              jq
              awscli2
              direnv
              gh
              nixfmt
              nil
            ];
          };
        }
      );
    };
}
