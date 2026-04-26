import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Use your ngrok URL for remote access
  static const String baseUrl = "https://armed-wavy-carwash.ngrok-free.dev"; 

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
