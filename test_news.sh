PROMPTS=(
  "what is the latest news in Aba"
  "what happened in Aba today"
  "latest news in Abia"
  "today's news in Ugwunagbo"
  "recent news in Ariaria"
  "latest Aba Power news"
  "Enyimba news"
  "current Aba news"
)

for PROMPT in "${PROMPTS[@]}"; do
  echo "--- TESTING: $PROMPT ---"
  curl -s -X POST http://localhost:3000/api/oracle \
    -H "Content-Type: application/json" \
    -d "{ \"prompt\": \"$PROMPT\", \"history\": [], \"catalog\": [] }" | jq -r '.text' | head -n 5
  echo -e "\n"
done
