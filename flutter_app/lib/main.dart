import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'video_call_screen.dart';

void main() {
  runApp(const MaterialApp(
    home: HomeScreen(),
    debugShowCheckedModeBanner: false,
  ));
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late IO.Socket socket;
  // Use your backend URL (Socket.io runs on port 5000 in your Node app)
  // Since we are using ngrok for AI, we should probably use it for Socket too 
  // if the user wants remote access. 
  final String socketUrl = "https://armed-wavy-carwash.ngrok-free.dev"; 

  @override
  void initState() {
    super.initState();
    initSocket();
  }

  void initSocket() {
    socket = IO.io(socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });

    socket.onConnect((_) {
      debugPrint('Connected to Socket Bridge');
      // For testing, we join a common room or user specific room
      // In your React app, users join their own ID room.
      socket.emit('join', 'test_user_123'); 
    });

    socket.on('incoming-call', (data) {
      debugPrint('Incoming Call: $data');
      _showIncomingCallDialog(data['fromName'], data['roomId']);
    });
  }

  void _showIncomingCallDialog(String callerName, String roomId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text("Incoming Legal Consultation"),
        content: Text("$callerName is requesting a video call."),
        actions: [
          TextButton(
            child: const Text("Reject", style: TextStyle(color: Colors.red)),
            onPressed: () => Navigator.pop(context),
          ),
          ElevatedButton(
            child: const Text("Accept"),
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => VideoCallScreen(
                    channelName: roomId,
                    appId: "6ef66b8bc55b45379afa2bd058d4926a",
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("JurisBot Consultation")),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.gavel, size: 80, color: Colors.blueAccent),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15)),
              child: const Text("Start Manual Call"),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const VideoCallScreen(
                      channelName: "case_123",
                      appId: "6ef66b8bc55b45379afa2bd058d4926a",
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
