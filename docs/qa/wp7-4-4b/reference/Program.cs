// Test-only driver around unmodified pinned upstream C# reference code.
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;
using Org.Webpki.JsonCanonicalizer;
using Org.Webpki.Es6NumberSerialization;

byte[] prefix = Encoding.UTF8.GetBytes("bugsys-gantt/snapshot-history/2\n");
var input = JsonDocument.Parse(File.ReadAllBytes(args[0]));
var results = new List<object>();
foreach (var request in input.RootElement.EnumerateArray())
{
    string id = request.GetProperty("id").GetString();
    try
    {
        byte[] bytes;
        if (request.TryGetProperty("bits", out var bits))
        {
            double value = BitConverter.Int64BitsToDouble(unchecked((long)Convert.ToUInt64(bits.GetString(), 16)));
            bytes = Encoding.UTF8.GetBytes("{\"n\":" + NumberToJson.SerializeNumber(value) + "}");
        }
        else if (request.TryGetProperty("expectedHex", out var expected))
        {
            // Hash known expected canonical bytes, independently of serialization.
            bytes = Convert.FromHexString(expected.GetString());
        }
        else
        {
            bytes = new JsonCanonicalizer(Convert.FromBase64String(request.GetProperty("inputBase64").GetString())).GetEncodedUTF8();
        }
        byte[] tagged = new byte[prefix.Length + bytes.Length];
        prefix.CopyTo(tagged, 0); bytes.CopyTo(tagged, prefix.Length);
        results.Add(new { id, canonicalHex = Convert.ToHexString(bytes).ToLowerInvariant(), rawSha256 = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant(), prefixedSha256 = Convert.ToHexString(SHA256.HashData(tagged)).ToLowerInvariant(), error = (string)null });
    }
    catch (Exception error)
    {
        results.Add(new { id, error = error.GetType().Name, message = error.Message });
    }
}
File.WriteAllText(args[1], JsonSerializer.Serialize(new { runtime = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription, results }, new JsonSerializerOptions { WriteIndented = true }) + "\n", new UTF8Encoding(false));
