const { Pinecone } = require("@pinecone-database/pinecone");
const pc = new Pinecone({
    apiKey: process.env.PINCODE_API_KEY,
});

const chatgptindex = pc.Index("chat-gpt");
async function createmomery({ vector, metadata, messageid }) {
    await chatgptindex.upsert({
        id: messageid,
        values: vector,
        metadata
    })
}
async function querymomery({ vector, limit = 5, metadata }) {

    const data = await chatgptindex.query({
        vector: vector,
        topK: limit,
        filter: metadata ? { metadata } : undefined,
        includeMetadata: true,
    });
    return data.matches
  }

module.exports = {createmomery,querymomery};