import 'dart:convert';
import 'http://http.dart' as http;

class ApiService {
  // Use your ngrok URL or Localhost IP (10.0.2.2 for Android Emulator)
  static const String baseUrl = "http://10.0.2.2:8088"; 

  static Future<Map<String, dynamic>> fetchToken(String channelName, int uid) async {
    final response = await http.get(
      Uri.parse("$baseUrl/generate-token?channel_name=$channelName&uid=$uid"),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception("Failed to load token: ${response.body}");
    }
  }
}
