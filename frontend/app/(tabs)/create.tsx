import {View, Text} from 'react-native'
import React, {useEffect} from 'react'
import {authClient} from "@/lib/auth-client";
import {getKeycloakAccessToken} from "@/lib/keycloak";
import {fetchAllWearables} from "@/api/backend/wearable.api";

const Create = () => {
    const { data } = authClient.useSession();

    useEffect(() => {
        if (!data?.user?.id) return;

        (async () => {
            try {
                const accessToken = await getKeycloakAccessToken(data.user.id);
                console.log(accessToken)
            } catch (err) {
                console.error("Failed to fetch total wearables:", err);
            }
        })();
    }, [data?.user?.id]);

    return (
        <View>
            <Text>Create</Text>
        </View>
    )
}
export default Create
