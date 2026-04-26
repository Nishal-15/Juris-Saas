import 'package:flutter/material.dart';
import 'video_call_screen.dart';

void main() {
  runApp(const MaterialApp(
    home: HomeScreen(),
    debugShowCheckedModeBanner: false,
  ));
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("JurisBot Consultation")),
      body: Center(
        child: ElevatedButton(
          child: const Text("Start Video Call"),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const VideoCallScreen(
                  channelName: "case_123", // Unique channel per case
                  appId: "c16823349942477382f6f595089e9095", // Replace with your App ID
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
