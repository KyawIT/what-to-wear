import {View, Text} from 'react-native'
import React from 'react'
import {Globe, User, StarsIcon, Shirt, Camera} from "lucide-react-native";

const TabIcon = ({iconType, focused}:{iconType:string, focused:boolean}) => {
    if (iconType === 'home') {
        return (
            <Globe fill={focused ? '#6366f1' : 'white'}/>
        )
    }else if(iconType === 'profile') {
        return (
            <User fill={focused ? '#6366f1' : 'white'}/>
        )
    }else if(iconType === 'recommendation') {
        return (
            <StarsIcon fill={focused ? '#ef4444' : 'white'}/>
        )
    }else if(iconType === 'create') {
        return (
            <Shirt fill={focused ? '#6366f1' : 'white'}/>
        )
    }else if(iconType === 'scan') {
        return (
            <Camera fill={focused ? '#ef4444' : 'white'}/>
        )
    }
    return (
        <View>
            <Text>TabIcon</Text>
        </View>
    )
}
export default TabIcon
