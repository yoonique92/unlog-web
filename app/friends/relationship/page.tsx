import { Suspense } from "react";
import FriendRelationshipDetail from "../../../components/friends/FriendRelationshipDetail";

export default function FriendRelationshipPage() {
  return (
    <Suspense fallback={null}>
      <FriendRelationshipDetail />
    </Suspense>
  );
}
