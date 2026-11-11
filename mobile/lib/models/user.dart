enum UserRole {
  admin,
  reviewer,
  creator,
  contractor;

  static UserRole fromString(String? role) {
    switch (role?.toLowerCase()) {
      case 'admin':
        return UserRole.admin;
      case 'reviewer':
        return UserRole.reviewer;
      case 'contractor':
        return UserRole.contractor;
      case 'creator':
      default:
        return UserRole.creator;
    }
  }

  String get displayName {
    switch (this) {
      case UserRole.admin:
        return 'Brand Director (Super Admin)';
      case UserRole.reviewer:
        return 'Compliance Officer';
      case UserRole.creator:
        return 'Content Creator';
      case UserRole.contractor:
        return 'Auditor / Viewer';
    }
  }

  String get displayNameHi {
    switch (this) {
      case UserRole.admin:
        return 'ब्रांड निदेशक (सुपर एडमिन)';
      case UserRole.reviewer:
        return 'अनुपालन अधिकारी (समीक्षक)';
      case UserRole.creator:
        return 'सामग्री निर्माता (क्रिएटर)';
      case UserRole.contractor:
        return 'ऑडिटर / सैंडबॉक्स दर्शक';
    }
  }
}

class User {
  final String id;
  final String email;
  final String name;
  final UserRole role;
  final String department;
  final String avatarColor;
  final String orgId;
  final String orgName;
  final String orgSlug;
  final bool zeroDataRetention;
  final String? token;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.department,
    required this.avatarColor,
    required this.orgId,
    required this.orgName,
    required this.orgSlug,
    required this.zeroDataRetention,
    this.token,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      role: UserRole.fromString(json['role']),
      department: json['department'] ?? 'Marketing',
      avatarColor: json['avatarColor'] ?? '#0F766E',
      orgId: json['orgId'] ?? '',
      orgName: json['orgName'] ?? 'Nimbus Labs',
      orgSlug: json['orgSlug'] ?? 'nimbus-labs',
      zeroDataRetention: json['zeroDataRetention'] ?? false,
      token: json['token'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role.name,
      'department': department,
      'avatarColor': avatarColor,
      'orgId': orgId,
      'orgName': orgName,
      'orgSlug': orgSlug,
      'zeroDataRetention': zeroDataRetention,
      if (token != null) 'token': token,
    };
  }
}

