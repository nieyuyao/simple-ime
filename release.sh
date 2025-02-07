npm set //registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN


# get the version
NODE_VERSION=$(node -p -e "require('./package.json').version")

if [[ $NODE_VERSION =~ "beta" ]]; then
  # beta
  npm publish --tag beta
else
  npm publish 
fi