from typing import Optional, List, Dict, Any
from datetime import datetime
import json
from supabase import create_client, Client
from config.supabase import supabase_config

class SupabaseClient:
    def __init__(self):
        self.client: Client = supabase_config.get_client()
        
    # Authentication Methods
    async def sign_up(self, email: str, password: str, username: str) -> Dict[str, Any]:
        """Register a new user"""
        try:
            # Create auth user
            auth_response = await self.client.auth.sign_up({
                "email": email,
                "password": password
            })
            
            if auth_response.user:
                # Create profile
                profile_data = {
                    "id": auth_response.user.id,
                    "email": email,
                    "username": username
                }
                
                await self.client.from_("profiles").insert(profile_data)
                
                return {
                    "success": True,
                    "user": auth_response.user,
                    "profile": profile_data
                }
            
            return {"success": False, "error": "Failed to create user"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    async def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """Sign in a user"""
        try:
            auth_response = await self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if auth_response.user:
                profile = await self.get_profile(auth_response.user.id)
                return {
                    "success": True,
                    "user": auth_response.user,
                    "profile": profile
                }
                
            return {"success": False, "error": "Invalid credentials"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    async def sign_out(self) -> Dict[str, Any]:
        """Sign out the current user"""
        try:
            await self.client.auth.sign_out()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    # Profile Methods
    async def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user's profile"""
        try:
            response = await self.client.from_("profiles").select("*").eq("id", user_id).single()
            return response.data
        except Exception:
            return None
            
    async def update_profile(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a user's profile"""
        try:
            response = await self.client.from_("profiles").update(data).eq("id", user_id)
            return {"success": True, "profile": response.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    # Beat Methods
    async def create_beat(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new beat"""
        try:
            beat_data = {
                "created_by": user_id,
                **data,
                "pattern": json.dumps(data.get("pattern", {}))
            }
            
            response = await self.client.from_("beats").insert(beat_data)
            return {"success": True, "beat": response.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    async def get_beat(self, beat_id: str) -> Optional[Dict[str, Any]]:
        """Get a beat by ID"""
        try:
            response = await self.client.from_("beats").select("*, profiles(*)").eq("id", beat_id).single()
            return response.data
        except Exception:
            return None
            
    async def update_beat(self, beat_id: str, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a beat"""
        try:
            if "pattern" in data:
                data["pattern"] = json.dumps(data["pattern"])
                
            response = await self.client.from_("beats").update(data).eq("id", beat_id).eq("created_by", user_id)
            return {"success": True, "beat": response.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    async def delete_beat(self, beat_id: str, user_id: str) -> Dict[str, Any]:
        """Delete a beat"""
        try:
            await self.client.from_("beats").delete().eq("id", beat_id).eq("created_by", user_id)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    # Collaboration Methods
    async def invite_collaborator(self, beat_id: str, user_id: str, role: str) -> Dict[str, Any]:
        """Invite a user to collaborate on a beat"""
        try:
            collab_data = {
                "beat_id": beat_id,
                "user_id": user_id,
                "role": role
            }
            
            response = await self.client.from_("collaborations").insert(collab_data)
            return {"success": True, "collaboration": response.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    async def get_collaborations(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all collaborations for a user"""
        try:
            response = await self.client.from_("collaborations").select("*, beats(*), profiles(*)").eq("user_id", user_id)
            return response.data
        except Exception:
            return []
            
    # Social Methods
    async def like_beat(self, beat_id: str, user_id: str) -> Dict[str, Any]:
        """Like a beat"""
        try:
            like_data = {
                "beat_id": beat_id,
                "user_id": user_id
            }
            
            response = await self.client.from_("likes").insert(like_data)
            return {"success": True, "like": response.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    async def unlike_beat(self, beat_id: str, user_id: str) -> Dict[str, Any]:
        """Unlike a beat"""
        try:
            await self.client.from_("likes").delete().eq("beat_id", beat_id).eq("user_id", user_id)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    async def add_comment(self, beat_id: str, user_id: str, content: str) -> Dict[str, Any]:
        """Add a comment to a beat"""
        try:
            comment_data = {
                "beat_id": beat_id,
                "user_id": user_id,
                "content": content
            }
            
            response = await self.client.from_("comments").insert(comment_data)
            return {"success": True, "comment": response.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    async def follow_user(self, follower_id: str, following_id: str) -> Dict[str, Any]:
        """Follow a user"""
        try:
            follow_data = {
                "follower_id": follower_id,
                "following_id": following_id
            }
            
            response = await self.client.from_("follows").insert(follow_data)
            return {"success": True, "follow": response.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    async def unfollow_user(self, follower_id: str, following_id: str) -> Dict[str, Any]:
        """Unfollow a user"""
        try:
            await self.client.from_("follows").delete().eq("follower_id", follower_id).eq("following_id", following_id)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    # Feed Methods
    async def get_feed(self, user_id: str, page: int = 1, limit: int = 20) -> List[Dict[str, Any]]:
        """Get user's feed"""
        try:
            offset = (page - 1) * limit
            response = await self.client.from_("beats").select(
                "*, profiles(*), likes(count), comments(count)"
            ).order("created_at", desc=True).range(offset, offset + limit)
            return response.data
        except Exception:
            return []
            
    async def get_user_feed(self, user_id: str, page: int = 1, limit: int = 20) -> List[Dict[str, Any]]:
        """Get a specific user's beats"""
        try:
            offset = (page - 1) * limit
            response = await self.client.from_("beats").select(
                "*, profiles(*), likes(count), comments(count)"
            ).eq("created_by", user_id).order("created_at", desc=True).range(offset, offset + limit)
            return response.data
        except Exception:
            return []
            
    # Notification Methods
    async def create_notification(self, user_id: str, type: str, actor_id: str, beat_id: Optional[str] = None) -> Dict[str, Any]:
        """Create a notification"""
        try:
            notification_data = {
                "user_id": user_id,
                "type": type,
                "actor_id": actor_id,
                "beat_id": beat_id
            }
            
            response = await self.client.from_("notifications").insert(notification_data)
            return {"success": True, "notification": response.data}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    async def get_notifications(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get user's notifications"""
        try:
            response = await self.client.from_("notifications").select(
                "*, actor:profiles(*), beats(*)"
            ).eq("user_id", user_id).order("created_at", desc=True).limit(limit)
            return response.data
        except Exception:
            return []
            
    async def mark_notifications_read(self, user_id: str) -> Dict[str, Any]:
        """Mark all notifications as read"""
        try:
            await self.client.from_("notifications").update(
                {"is_read": True}
            ).eq("user_id", user_id).eq("is_read", False)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

# Create a singleton instance
supabase = SupabaseClient() 