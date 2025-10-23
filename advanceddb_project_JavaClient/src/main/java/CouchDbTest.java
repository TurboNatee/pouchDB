import redis.clients.jedis.Jedis;
import com.google.gson.JsonObject;
import org.lightcouch.CouchDbClient;

void main() {
    CouchDbClient dbClient = new CouchDbClient(
            "advanceddb_project",
            false,
            "http",
            "127.0.0.1",
            5984,
            "admin",
            "mtu12345"
    );
    Jedis jedis = new Jedis("127.0.0.1", 6379);
    String flightID = "7f71e18c920bcaa1e48ed6fccc0009ab";
    String cachedFlightID = jedis.get(flightID);

    if (cachedFlightID != null) {
        System.out.println("Flight from cache: " + cachedFlightID);
    }
    else {
        JsonObject getFlightJsonObject = dbClient.find(JsonObject.class, flightID);
        String FlightInfo = getFlightJsonObject.toString();
        jedis.setex(flightID, 3600, FlightInfo);
        System.out.println("Flight from CouchDB: " + FlightInfo);

    }

    dbClient.shutdown();
    jedis.close();
}

