const plugins = require("@expo/config-plugins");
const {
  mergeContents,
} = require("@expo/config-plugins/build/utils/generateCode");
const fs = require("fs");
const path = require("path");

module.exports = function withReactNativePermissions(config, permissions) {
  if (!permissions || !Array.isArray(permissions))
    throw new Error("No permissions provided");

  return plugins.withDangerousMod(config, [
    "ios",
    async (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile",
      );
      const contents = fs.readFileSync(filePath, "utf-8");

      const addReactNativePermissions = mergeContents({
        tag: "react-native-permissions",
        src: contents,
        newSrc: `require Pod::Executable.execute_command('node', ['-p',
     "require.resolve(
       'react-native-permissions/scripts/setup.rb',
       {paths: [process.argv[1]]},
     )", __dir__]).strip
     
     setup_permissions([
${permissions.map((p) => `'${p}'`).join(",\n     ")}
     ])`,
        anchor: /^target /gm,
        offset: -1,
        comment: "#",
      });

      if (!addReactNativePermissions.didMerge) {
        console.log(
          "ERROR: Cannot add react-native-permissions to the project's ios/Podfile because it's malformed. Please report this with a copy of your project Podfile.",
        );
        return config;
      }

      fs.writeFileSync(filePath, addReactNativePermissions.contents);

      return config;
    },
  ]);
};
